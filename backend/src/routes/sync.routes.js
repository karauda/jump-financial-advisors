const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { syncAllForUser, syncGmailForUser, syncHubSpotForUser, syncCalendarForUser } = require('../jobs/sync.jobs');
const pool = require('../config/database');

const router = express.Router();

// Trigger full sync
router.post('/sync', ensureAuthenticated, async (req, res) => {
  try {
    // Start sync in background
    syncAllForUser(req.user.id).catch(console.error);

    res.json({ message: 'Sync started' });
  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

// Trigger Gmail sync
router.post('/sync/gmail', ensureAuthenticated, async (req, res) => {
  try {
    syncGmailForUser(req.user.id).catch(console.error);
    res.json({ message: 'Gmail sync started' });
  } catch (error) {
    console.error('Error starting Gmail sync:', error);
    res.status(500).json({ error: 'Failed to start Gmail sync' });
  }
});

// Trigger HubSpot sync
router.post('/sync/hubspot', ensureAuthenticated, async (req, res) => {
  try {
    syncHubSpotForUser(req.user.id).catch(console.error);
    res.json({ message: 'HubSpot sync started' });
  } catch (error) {
    console.error('Error starting HubSpot sync:', error);
    res.status(500).json({ error: 'Failed to start HubSpot sync' });
  }
});

// Trigger Calendar sync
router.post('/sync/calendar', ensureAuthenticated, async (req, res) => {
  try {
    syncCalendarForUser(req.user.id).catch(console.error);
    res.json({ message: 'Calendar sync started' });
  } catch (error) {
    console.error('Error starting Calendar sync:', error);
    res.status(500).json({ error: 'Failed to start Calendar sync' });
  }
});

// Get sync status
router.get('/sync/status', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT service, last_sync, status, error
       FROM sync_status
       WHERE user_id = $1`,
      [req.user.id]
    );

    const status = {};
    result.rows.forEach(row => {
      status[row.service] = {
        lastSync: row.last_sync,
        status: row.status,
        error: row.error,
      };
    });

    res.json({ status });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

module.exports = router;
