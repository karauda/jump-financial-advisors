const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get all ongoing instructions
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, instruction, is_active, created_at
       FROM ongoing_instructions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ instructions: result.rows });
  } catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ error: 'Failed to fetch instructions' });
  }
});

// Create new instruction
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { instruction } = req.body;

    if (!instruction) {
      return res.status(400).json({ error: 'Instruction is required' });
    }

    const result = await pool.query(
      `INSERT INTO ongoing_instructions (user_id, instruction)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, instruction]
    );

    res.json({ instruction: result.rows[0] });
  } catch (error) {
    console.error('Error creating instruction:', error);
    res.status(500).json({ error: 'Failed to create instruction' });
  }
});

// Toggle instruction active status
router.patch('/:id/toggle', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE ongoing_instructions
       SET is_active = NOT is_active
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    res.json({ instruction: result.rows[0] });
  } catch (error) {
    console.error('Error toggling instruction:', error);
    res.status(500).json({ error: 'Failed to toggle instruction' });
  }
});

// Delete instruction
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM ongoing_instructions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ error: 'Failed to delete instruction' });
  }
});

module.exports = router;
