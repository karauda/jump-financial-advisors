const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { runAgent } = require('../services/agent.service');
const pool = require('../config/database');

const router = express.Router();

// Get all conversations
router.get('/conversations', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, 
              created_at AT TIME ZONE 'UTC' as created_at,
              updated_at AT TIME ZONE 'UTC' as updated_at
       FROM conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create new conversation
router.post('/conversations', ensureAuthenticated, async (req, res) => {
  try {
    const { title } = req.body;

    const result = await pool.query(
      `INSERT INTO conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, title || 'New Conversation']
    );

    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', ensureAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;

    // Verify conversation belongs to user
    const convResult = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messagesResult = await pool.query(
      `SELECT id, role, content, tool_calls, 
              created_at AT TIME ZONE 'UTC' as created_at
       FROM messages
       WHERE conversation_id = $1 AND role IN ('user', 'assistant')
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({ messages: messagesResult.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/conversations/:id/messages', ensureAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify conversation belongs to user
    const convResult = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Update conversation timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    // Run agent
    const response = await runAgent(req.user.id, conversationId, message);

    res.json({
      content: response.content,
      done: response.done,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Delete conversation
router.delete('/conversations/:id', ensureAuthenticated, async (req, res) => {
  try {
    const conversationId = req.params.id;

    // Verify and delete
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [conversationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
