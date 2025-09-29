const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all prescriptions (for practitioners: their own, for suppliers: available ones)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query, params;
    
    if (req.user.user_type === 'practitioner') {
      query = `
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'herb_name', h.name,
                   'chinese_name', h.chinese_name,
                   'quantity_per_day', pi.quantity_per_day,
                   'total_quantity', pi.total_quantity,
                   'notes', pi.notes
                 )
               ) as items
        FROM prescriptions p
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        LEFT JOIN herbs h ON pi.herb_id = h.id
        WHERE p.practitioner_id = $1
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Suppliers see pending prescriptions
      query = `
        SELECT p.*, u.name as practitioner_name,
               json_agg(
                 json_build_object(
                   'herb_name', h.name,
                   'chinese_name', h.chinese_name,
                   'quantity_per_day', pi.quantity_per_day,
                   'total_quantity', pi.total_quantity,
                   'notes', pi.notes
                 )
               ) as items
        FROM prescriptions p
        JOIN users u ON p.practitioner_id = u.id
        LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
        LEFT JOIN herbs h ON pi.herb_id = h.id
        WHERE p.status = 'pending'
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `;
      params = [];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create prescription (practitioners only)
router.post('/', [
  authenticateToken,
  requireRole('practitioner'),
  body('patient_name').trim().isLength({ min: 2 }),
  body('treatment_days').isInt({ min: 1 }),
  body('items').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patient_name, patient_phone, patient_address, patient_dob, symptoms, diagnosis, treatment_days, items, notes } = req.body;

    await db.query('BEGIN');

    // Create prescription
    const prescriptionResult = await db.query(
      'INSERT INTO prescriptions (practitioner_id, patient_name, patient_phone, patient_address, patient_dob, symptoms, diagnosis, treatment_days, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [req.user.id, patient_name, patient_phone, patient_address, patient_dob || null, symptoms, diagnosis, treatment_days, notes]
    );

    const prescriptionId = prescriptionResult.rows[0].id;

    // Add prescription items
    for (const item of items) {
      // Find herb by English name, Chinese name, or ID
      let herbResult;
      let herbId;

      if (item.herb_id) {
        // If herb_id is provided (from autocomplete selection)
        herbResult = await db.query('SELECT id FROM herbs WHERE id = $1', [item.herb_id]);
        if (herbResult.rows.length > 0) {
          herbId = herbResult.rows[0].id;
        }
      } else {
        // Search by name (English or Chinese)
        herbResult = await db.query(
          'SELECT id FROM herbs WHERE name = $1 OR chinese_name = $1', 
          [item.herb_name]
        );
        
        if (herbResult.rows.length > 0) {
          herbId = herbResult.rows[0].id;
        } else {
          // Create new herb if not found
          const newHerbResult = await db.query(
            'INSERT INTO herbs (name, chinese_name) VALUES ($1, $2) RETURNING id',
            [item.herb_name, item.chinese_name || null]
          );
          herbId = newHerbResult.rows[0].id;
        }
      }

      const totalQuantity = item.quantity_per_day * treatment_days;

      await db.query(
        'INSERT INTO prescription_items (prescription_id, herb_id, quantity_per_day, total_quantity, notes) VALUES ($1, $2, $3, $4, $5)',
        [prescriptionId, herbId, item.quantity_per_day, totalQuantity, item.notes]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({ id: prescriptionId, message: 'Prescription created successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available suppliers for a prescription
router.get('/:prescriptionId/suppliers', authenticateToken, requireRole('practitioner'), async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    
    // Verify prescription belongs to practitioner
    const prescriptionCheck = await db.query(
      'SELECT id FROM prescriptions WHERE id = $1 AND practitioner_id = $2',
      [prescriptionId, req.user.id]
    );
    
    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    // Get prescription items
    const prescriptionItems = await db.query(`
      SELECT pi.herb_id, h.name as herb_name, h.chinese_name, pi.total_quantity
      FROM prescription_items pi
      JOIN herbs h ON pi.herb_id = h.id
      WHERE pi.prescription_id = $1
    `, [prescriptionId]);
    
    if (prescriptionItems.rows.length === 0) {
      return res.json([]);
    }
    
    // Find suppliers who have ALL required herbs in sufficient quantities
    const herbIds = prescriptionItems.rows.map(item => item.herb_id);
    const herbRequirements = prescriptionItems.rows.reduce((acc, item) => {
      acc[item.herb_id] = item.total_quantity;
      return acc;
    }, {});
    
    const suppliersQuery = `
      SELECT 
        u.id as supplier_id,
        u.name as supplier_name,
        u.email,
        u.phone,
        u.address,
        COUNT(si.herb_id) as available_herbs,
        json_agg(
          json_build_object(
            'herb_id', si.herb_id,
            'herb_name', h.name,
            'chinese_name', h.chinese_name,
            'available_quantity', si.quantity_available,
            'required_quantity', pi.total_quantity,
            'price_per_gram', si.price_per_gram,
            'quality_grade', si.quality_grade,
            'expiry_date', si.expiry_date,
            'line_total', si.price_per_gram * pi.total_quantity
          )
        ) as herb_details
      FROM users u
      JOIN supplier_inventory si ON u.id = si.supplier_id
      JOIN herbs h ON si.herb_id = h.id
      JOIN prescription_items pi ON si.herb_id = pi.herb_id AND pi.prescription_id = $1
      WHERE u.user_type = 'supplier'
        AND si.herb_id = ANY($2)
        AND si.quantity_available >= pi.total_quantity
      GROUP BY u.id, u.name, u.email, u.phone, u.address
      HAVING COUNT(si.herb_id) = $3
      ORDER BY u.name ASC
    `;
    
    const result = await db.query(suppliersQuery, [
      prescriptionId,
      herbIds,
      herbIds.length
    ]);
    
    // Calculate actual totals
    const suppliers = result.rows.map(supplier => {
      const actualTotal = supplier.herb_details.reduce((sum, herb) => {
        return sum + (herb.price_per_gram * herb.required_quantity);
      }, 0);
      
      return {
        ...supplier,
        estimated_total: Math.round(actualTotal * 100) / 100,
        herb_details: supplier.herb_details.map(herb => ({
          ...herb,
          line_total: Math.round(herb.price_per_gram * herb.required_quantity * 100) / 100
        }))
      };
    });
    
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching available suppliers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Select supplier for prescription (practitioner creates order)
router.post('/:prescriptionId/select-supplier', [
  authenticateToken,
  requireRole('practitioner'),
  body('supplier_id').isInt(),
  body('total_amount').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prescriptionId } = req.params;
    const { supplier_id, total_amount, notes } = req.body;

    // Verify prescription belongs to practitioner
    const prescriptionCheck = await db.query(
      'SELECT id, status FROM prescriptions WHERE id = $1 AND practitioner_id = $2',
      [prescriptionId, req.user.id]
    );

    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescriptionCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Prescription is no longer pending' });
    }

    // Verify supplier exists
    const supplierCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND user_type = $2',
      [supplier_id, 'supplier']
    );

    if (supplierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await db.query('BEGIN');

    try {
      // Create order with pending confirmation status
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);

      const orderResult = await db.query(
        'INSERT INTO orders (prescription_id, supplier_id, estimated_completion, total_amount, notes, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [prescriptionId, supplier_id, estimatedCompletion, total_amount, notes || 'Order placed by practitioner', 'pending_confirmation']
      );

      // Update prescription status to awaiting supplier confirmation
      await db.query(
        'UPDATE prescriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['awaiting_supplier_confirmation', prescriptionId]
      );

      await db.query('COMMIT');

      res.status(201).json({ 
        orderId: orderResult.rows[0].id, 
        message: 'Order placed successfully' 
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error selecting supplier:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search herbs for autocomplete (supports both English and Chinese)
router.get('/herbs/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query; // search query
    
    if (!q || q.length < 1) {
      return res.json([]);
    }
    
    // Search in both English and Chinese names
    const result = await db.query(`
      SELECT id, name, chinese_name, description, category
      FROM herbs 
      WHERE 
        LOWER(name) LIKE LOWER($1) OR 
        chinese_name LIKE $1 OR
        LOWER(description) LIKE LOWER($1)
      ORDER BY 
        CASE 
          WHEN LOWER(name) LIKE LOWER($2) THEN 1
          WHEN chinese_name LIKE $2 THEN 2
          WHEN LOWER(name) LIKE LOWER($1) THEN 3
          WHEN chinese_name LIKE $1 THEN 4
          ELSE 5
        END,
        name
      LIMIT 20
    `, [`%${q}%`, `${q}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching herbs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel prescription (practitioner only) - only for pending prescriptions
router.delete('/:prescriptionId', [
  authenticateToken,
  requireRole('practitioner')
], async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { reason } = req.body;

    // Verify prescription belongs to practitioner and is in cancellable state
    const prescriptionCheck = await db.query(
      'SELECT id, status, patient_name FROM prescriptions WHERE id = $1 AND practitioner_id = $2',
      [prescriptionId, req.user.id]
    );

    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = prescriptionCheck.rows[0];

    // Only allow cancellation for pending prescriptions (before supplier selection)
    if (!['pending', 'awaiting_supplier_confirmation'].includes(prescription.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel prescription after supplier assignment. Use order cancellation instead.' 
      });
    }

    await db.query('BEGIN');

    try {
      // Delete any pending orders for this prescription
      await db.query('DELETE FROM orders WHERE prescription_id = $1', [prescriptionId]);

      // Delete prescription items
      await db.query('DELETE FROM prescription_items WHERE prescription_id = $1', [prescriptionId]);

      // Delete the prescription
      await db.query('DELETE FROM prescriptions WHERE id = $1', [prescriptionId]);

      await db.query('COMMIT');

      res.json({ 
        message: `Prescription for ${prescription.patient_name} cancelled successfully.`,
        reason: reason || 'Cancelled by practitioner'
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;