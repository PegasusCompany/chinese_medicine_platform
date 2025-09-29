const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Accept prescription (supplier creates order)
router.post('/accept/:prescriptionId', [
  authenticateToken,
  body('estimated_completion').isISO8601(),
  body('total_amount').optional().isNumeric()
], async (req, res) => {
  try {
    if (req.user.user_type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can accept prescriptions' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prescriptionId } = req.params;
    const { estimated_completion, total_amount, notes } = req.body;

    await db.query('BEGIN');

    // Check if prescription is still pending
    const prescriptionCheck = await db.query(
      'SELECT status FROM prescriptions WHERE id = $1',
      [prescriptionId]
    );

    if (prescriptionCheck.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescriptionCheck.rows[0].status !== 'pending') {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Prescription is no longer available' });
    }

    // Create order
    const orderResult = await db.query(
      'INSERT INTO orders (prescription_id, supplier_id, estimated_completion, total_amount, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [prescriptionId, req.user.id, estimated_completion, total_amount, notes]
    );

    // Update prescription status
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['assigned', prescriptionId]
    );

    await db.query('COMMIT');

    res.status(201).json({ 
      orderId: orderResult.rows[0].id, 
      message: 'Prescription accepted successfully' 
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error accepting prescription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;

    if (req.user.user_type === 'supplier') {
      query = `
        SELECT o.*, p.patient_name, p.treatment_days, u.name as practitioner_name,
               json_agg(
                 json_build_object(
                   'herb_name', h.name,
                   'chinese_name', h.chinese_name,
                   'quantity_per_day', pi.quantity_per_day,
                   'total_quantity', pi.total_quantity
                 )
               ) as items
        FROM orders o
        JOIN prescriptions p ON o.prescription_id = p.id
        JOIN users u ON p.practitioner_id = u.id
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        LEFT JOIN herbs h ON pi.herb_id = h.id
        WHERE o.supplier_id = $1
        GROUP BY o.id, p.patient_name, p.treatment_days, u.name
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT o.*, p.patient_name, p.patient_phone, p.patient_address, p.patient_dob, 
               p.symptoms, p.diagnosis, p.treatment_days, u.name as supplier_name,
               json_agg(
                 json_build_object(
                   'herb_name', h.name,
                   'chinese_name', h.chinese_name,
                   'quantity_per_day', pi.quantity_per_day,
                   'total_quantity', pi.total_quantity
                 )
               ) as items
        FROM orders o
        JOIN prescriptions p ON o.prescription_id = p.id
        JOIN users u ON o.supplier_id = u.id
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        LEFT JOIN herbs h ON pi.herb_id = h.id
        WHERE p.practitioner_id = $1
        GROUP BY o.id, p.patient_name, p.patient_phone, p.patient_address, p.patient_dob, 
                 p.symptoms, p.diagnosis, p.treatment_days, u.name
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.put('/:orderId/status', [
  authenticateToken,
  body('status').isIn(['accepted', 'preparing', 'packed', 'shipped', 'delivered', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Check if user owns this order
    let checkQuery, checkParams;
    if (req.user.user_type === 'supplier') {
      checkQuery = 'SELECT id FROM orders WHERE id = $1 AND supplier_id = $2';
      checkParams = [orderId, req.user.id];
    } else {
      checkQuery = `
        SELECT o.id FROM orders o
        JOIN prescriptions p ON o.prescription_id = p.id
        WHERE o.id = $1 AND p.practitioner_id = $2
      `;
      checkParams = [orderId, req.user.id];
    }

    const checkResult = await db.query(checkQuery, checkParams);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams = [orderId, status];

    if (status === 'delivered') {
      updateFields.push('actual_completion = CURRENT_TIMESTAMP');
    }

    // When order is completed, also update prescription status to completed
    if (status === 'completed') {
      // Update the prescription status to completed as well
      const prescriptionUpdate = await db.query(
        'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT prescription_id FROM orders WHERE id = $2)',
        ['completed', orderId]
      );
    }

    if (notes) {
      updateFields.push(`notes = $${updateParams.length + 1}`);
      updateParams.push(notes);
    }

    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $1`,
      updateParams
    );

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept order (supplier confirms they will fulfill it)
router.put('/:orderId/accept', [
  authenticateToken
], async (req, res) => {
  try {
    if (req.user.user_type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can accept orders' });
    }

    const { orderId } = req.params;
    const { estimated_completion, notes } = req.body;

    // Check if supplier owns this order and it's pending confirmation
    const orderCheck = await db.query(
      'SELECT o.id, o.prescription_id, o.status FROM orders o WHERE o.id = $1 AND o.supplier_id = $2',
      [orderId, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (order.status !== 'pending_confirmation') {
      return res.status(400).json({ error: 'Order is not pending confirmation' });
    }

    await db.query('BEGIN');

    // Update order status to accepted
    await db.query(
      'UPDATE orders SET status = $1, estimated_completion = $2, notes = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      ['accepted', estimated_completion || null, notes || 'Order accepted by supplier', orderId]
    );

    // Update prescription status to assigned
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['assigned', order.prescription_id]
    );

    await db.query('COMMIT');

    res.json({ message: 'Order accepted successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error accepting order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject order (supplier declines to fulfill it)
router.put('/:orderId/reject', [
  authenticateToken
], async (req, res) => {
  try {
    if (req.user.user_type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can reject orders' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    // Check if supplier owns this order and it's pending confirmation
    const orderCheck = await db.query(
      'SELECT o.id, o.prescription_id, o.status FROM orders o WHERE o.id = $1 AND o.supplier_id = $2',
      [orderId, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (order.status !== 'pending_confirmation') {
      return res.status(400).json({ error: 'Order is not pending confirmation' });
    }

    await db.query('BEGIN');

    // Delete the rejected order
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);

    // Return prescription to pending status so practitioner can select another supplier
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['pending', order.prescription_id]
    );

    await db.query('COMMIT');

    res.json({ 
      message: 'Order rejected successfully. Prescription returned to practitioner for supplier reselection.',
      reason: reason || 'No reason provided'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error rejecting order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request cancellation for confirmed orders (requires practitioner approval)
router.put('/:orderId/request-cancellation', [
  authenticateToken
], async (req, res) => {
  try {
    if (req.user.user_type !== 'supplier') {
      return res.status(403).json({ error: 'Only suppliers can request cancellation' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Reason is required for cancellation requests' });
    }

    // Check if supplier owns this order and it's confirmed
    const orderCheck = await db.query(
      'SELECT o.id, o.prescription_id, o.status FROM orders o WHERE o.id = $1 AND o.supplier_id = $2',
      [orderId, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    // Only allow cancellation requests for confirmed orders
    if (!['accepted', 'preparing'].includes(order.status)) {
      return res.status(400).json({ error: 'Can only request cancellation for confirmed orders' });
    }

    // Update order with cancellation request
    await db.query(
      'UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['cancellation_requested', `CANCELLATION REQUESTED: ${reason}`, orderId]
    );

    // Update prescription status to indicate cancellation is pending
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancellation_pending', order.prescription_id]
    );

    res.json({ 
      message: 'Cancellation request sent to practitioner. Order remains active until approved.',
      reason: reason
    });
  } catch (error) {
    console.error('Error requesting cancellation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Legacy cancel endpoint - now restricted to prevent confirmed order cancellation
router.put('/:orderId/cancel', [
  authenticateToken
], async (req, res) => {
  try {
    return res.status(400).json({ 
      error: 'Direct cancellation not allowed. Use reject for pending orders, or request-cancellation for confirmed orders.' 
    });
  } catch (error) {
    console.error('Error with cancel endpoint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve cancellation request (practitioner only)
router.put('/:orderId/approve-cancellation', [
  authenticateToken
], async (req, res) => {
  try {
    if (req.user.user_type !== 'practitioner') {
      return res.status(403).json({ error: 'Only practitioners can approve cancellation requests' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    // Check if practitioner owns this order's prescription
    const orderCheck = await db.query(`
      SELECT o.id, o.prescription_id, o.status, p.practitioner_id 
      FROM orders o
      JOIN prescriptions p ON o.prescription_id = p.id
      WHERE o.id = $1 AND p.practitioner_id = $2
    `, [orderId, req.user.id]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (order.status !== 'cancellation_requested') {
      return res.status(400).json({ error: 'No cancellation request pending for this order' });
    }

    await db.query('BEGIN');

    // Delete the order
    await db.query('DELETE FROM orders WHERE id = $1', [orderId]);

    // Return prescription to pending status for supplier reselection
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['pending', order.prescription_id]
    );

    await db.query('COMMIT');

    res.json({ 
      message: 'Cancellation approved. Prescription is now available for supplier reselection.',
      reason: reason || 'Approved by practitioner'
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error approving cancellation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Deny cancellation request (practitioner only)
router.put('/:orderId/deny-cancellation', [
  authenticateToken
], async (req, res) => {
  try {
    if (req.user.user_type !== 'practitioner') {
      return res.status(403).json({ error: 'Only practitioners can deny cancellation requests' });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    // Check if practitioner owns this order's prescription
    const orderCheck = await db.query(`
      SELECT o.id, o.prescription_id, o.status, p.practitioner_id 
      FROM orders o
      JOIN prescriptions p ON o.prescription_id = p.id
      WHERE o.id = $1 AND p.practitioner_id = $2
    `, [orderId, req.user.id]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (order.status !== 'cancellation_requested') {
      return res.status(400).json({ error: 'No cancellation request pending for this order' });
    }

    // Return order to accepted status (supplier must fulfill)
    await db.query(
      'UPDATE orders SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['accepted', `Cancellation request denied by practitioner. Reason: ${reason || 'No reason provided'}`, orderId]
    );

    // Update prescription status back to assigned
    await db.query(
      'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['assigned', order.prescription_id]
    );

    res.json({ 
      message: 'Cancellation request denied. Supplier must fulfill the order.',
      reason: reason || 'Denied by practitioner'
    });
  } catch (error) {
    console.error('Error denying cancellation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;