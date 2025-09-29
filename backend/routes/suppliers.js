const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get supplier inventory
router.get('/inventory', authenticateToken, requireRole('supplier'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT si.*, h.name as herb_name, h.chinese_name
      FROM supplier_inventory si
      JOIN herbs h ON si.herb_id = h.id
      WHERE si.supplier_id = $1
      ORDER BY h.name
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory item
router.put('/inventory/:herbId', [
  authenticateToken,
  requireRole('supplier'),
  body('quantity_available').isNumeric(),
  body('price_per_gram').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { herbId } = req.params;
    const { quantity_available, price_per_gram, quality_grade, expiry_date } = req.body;

    const result = await db.query(`
      INSERT INTO supplier_inventory (supplier_id, herb_id, quantity_available, price_per_gram, quality_grade, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (supplier_id, herb_id)
      DO UPDATE SET
        quantity_available = $3,
        price_per_gram = $4,
        quality_grade = $5,
        expiry_date = $6,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, herbId, quantity_available, price_per_gram, quality_grade, expiry_date]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete inventory item
router.delete('/inventory/:herbId', [
  authenticateToken,
  requireRole('supplier')
], async (req, res) => {
  try {
    const { herbId } = req.params;

    // Check if the inventory item exists and belongs to the supplier
    const checkResult = await db.query(
      'SELECT id FROM supplier_inventory WHERE supplier_id = $1 AND herb_id = $2',
      [req.user.id, herbId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Delete the inventory item
    await db.query(
      'DELETE FROM supplier_inventory WHERE supplier_id = $1 AND herb_id = $2',
      [req.user.id, herbId]
    );

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all herbs (for inventory management)
router.get('/herbs', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM herbs ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching herbs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;