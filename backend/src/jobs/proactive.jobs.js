const pool = require('../config/database');
const { runAgent } = require('../services/agent.service');
const gmailService = require('../services/gmail.service');
const { syncGmailForUser } = require('./sync.jobs');
const ragService = require('../services/rag.service');

// Check for new emails and trigger proactive agent actions
async function checkForNewEmails(userId) {
  console.log(`Checking for new emails for user ${userId}`);

  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.google_tokens) {
      return;
    }

    // Get the last processed email timestamp
    const lastEmailResult = await pool.query(
      `SELECT MAX(date) as last_date FROM emails WHERE user_id = $1`,
      [userId]
    );

    const lastDate = lastEmailResult.rows[0]?.last_date;

    // Sync recent emails
    await syncGmailForUser(userId);

    // Get emails received after last check
    let query = `SELECT * FROM emails WHERE user_id = $1`;
    const params = [userId];

    if (lastDate) {
      query += ` AND date > $2`;
      params.push(lastDate);
    }

    query += ` ORDER BY date DESC LIMIT 10`;

    const newEmailsResult = await pool.query(query, params);
    const newEmails = newEmailsResult.rows;

    if (newEmails.length === 0) {
      console.log('No new emails found');
      return;
    }

    console.log(`Found ${newEmails.length} new emails`);

    // Check if we have ongoing instructions
    const instructionsResult = await pool.query(
      'SELECT instruction FROM ongoing_instructions WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (instructionsResult.rows.length === 0) {
      console.log('No ongoing instructions, skipping proactive actions');
      return;
    }

    // Get or create a system conversation for proactive actions
    let conversationResult = await pool.query(
      `SELECT id FROM conversations
       WHERE user_id = $1 AND title = 'Proactive Actions'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    let conversationId;
    if (conversationResult.rows.length === 0) {
      conversationResult = await pool.query(
        `INSERT INTO conversations (user_id, title)
         VALUES ($1, 'Proactive Actions')
         RETURNING id`,
        [userId]
      );
      conversationId = conversationResult.rows[0].id;
    } else {
      conversationId = conversationResult.rows[0].id;
    }

    // Process each new email
    for (const email of newEmails) {
      try {
        const prompt = `
New email received:
From: ${email.from_name} <${email.from_email}>
Subject: ${email.subject}
Date: ${email.date}
Content: ${email.content.substring(0, 500)}

Based on your ongoing instructions, should you take any action? If so, proceed with the appropriate actions. If not, respond with "No action needed."
        `.trim();

        console.log(`Processing email: ${email.subject}`);

        const response = await runAgent(userId, conversationId, prompt);

        if (response.content && !response.content.includes('No action needed')) {
          console.log(`Proactive action taken for email: ${email.subject}`);
          console.log(`Response: ${response.content}`);
        }
      } catch (error) {
        console.error(`Error processing email ${email.email_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error checking for new emails for user ${userId}:`, error);
  }
}

// Poll for all active users
async function pollForProactiveActions() {
  try {
    // Get all users with Google tokens (active users)
    const usersResult = await pool.query(
      `SELECT id FROM users WHERE google_tokens IS NOT NULL`
    );

    console.log(`Polling ${usersResult.rows.length} users for proactive actions`);

    for (const user of usersResult.rows) {
      try {
        await checkForNewEmails(user.id);
      } catch (error) {
        console.error(`Error polling user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in proactive polling:', error);
  }
}

module.exports = {
  checkForNewEmails,
  pollForProactiveActions,
};
