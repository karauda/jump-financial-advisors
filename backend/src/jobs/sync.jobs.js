const pool = require('../config/database');
const gmailService = require('../services/gmail.service');
const hubspotService = require('../services/hubspot.service');
const calendarService = require('../services/calendar.service');
const ragService = require('../services/rag.service');

async function syncGmailForUser(userId) {
  console.log(`Starting Gmail sync for user ${userId}`);

  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.google_tokens) {
      console.log('User not found or no Google tokens');
      return;
    }

    const tokens = user.google_tokens;

    // Get last sync time
    const syncResult = await pool.query(
      `SELECT last_sync FROM sync_status
       WHERE user_id = $1 AND service = 'gmail'`,
      [userId]
    );

    let query = 'in:inbox';
    if (syncResult.rows.length > 0 && syncResult.rows[0].last_sync) {
      const lastSync = new Date(syncResult.rows[0].last_sync);
      const timestamp = Math.floor(lastSync.getTime() / 1000);
      query += ` after:${timestamp}`;
    }

    // List emails (limited to 100 per sync)
    const emailsList = await gmailService.listEmails(tokens, 100);

    if (!emailsList.messages) {
      console.log('No new emails found');
      await updateSyncStatus(userId, 'gmail', 'success');
      return;
    }

    console.log(`Found ${emailsList.messages.length} emails to sync`);

    // Fetch and store each email
    let processed = 0;
    for (const message of emailsList.messages) {
      try {
        const email = await gmailService.getEmail(tokens, message.id);
        await ragService.storeEmail(userId, email);
        processed++;

        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${emailsList.messages.length} emails`);
        }
      } catch (error) {
        console.error(`Error processing email ${message.id}:`, error);
      }
    }

    console.log(`Gmail sync completed. Processed ${processed} emails`);
    await updateSyncStatus(userId, 'gmail', 'success');
  } catch (error) {
    console.error(`Error syncing Gmail for user ${userId}:`, error);
    await updateSyncStatus(userId, 'gmail', 'error', error.message);
  }
}

async function syncHubSpotForUser(userId) {
  console.log(`Starting HubSpot sync for user ${userId}`);

  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.hubspot_tokens) {
      console.log('User not found or no HubSpot tokens');
      return;
    }

    const accessToken = user.hubspot_tokens.access_token;

    // Sync contacts
    let after = null;
    let totalContacts = 0;

    do {
      const response = await hubspotService.listContacts(accessToken, 100, after);

      for (const contact of response.results) {
        try {
          await ragService.storeHubSpotContact(userId, contact);
          totalContacts++;

          // Also fetch and store notes for this contact
          try {
            const notes = await hubspotService.getContactNotes(accessToken, contact.id);
            for (const note of notes) {
              await ragService.storeHubSpotNote(userId, note, contact.id);
            }
          } catch (noteError) {
            console.error(`Error fetching notes for contact ${contact.id}:`, noteError);
          }
        } catch (error) {
          console.error(`Error processing contact ${contact.id}:`, error);
        }
      }

      after = response.paging?.next?.after;

      console.log(`Processed ${totalContacts} contacts so far...`);
    } while (after);

    console.log(`HubSpot sync completed. Processed ${totalContacts} contacts`);
    await updateSyncStatus(userId, 'hubspot', 'success');
  } catch (error) {
    console.error(`Error syncing HubSpot for user ${userId}:`, error);
    await updateSyncStatus(userId, 'hubspot', 'error', error.message);
  }
}

async function syncCalendarForUser(userId) {
  console.log(`Starting Calendar sync for user ${userId}`);

  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user || !user.google_tokens) {
      console.log('User not found or no Google tokens');
      return;
    }

    const tokens = user.google_tokens;

    // Get events from last 30 days and next 90 days
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const events = await calendarService.listEvents(
      tokens,
      past.toISOString(),
      future.toISOString(),
      250
    );

    console.log(`Found ${events.length} calendar events`);

    // Store events
    for (const event of events) {
      try {
        await pool.query(
          `INSERT INTO calendar_events
           (user_id, event_id, summary, description, start_time, end_time, attendees, location)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (event_id)
           DO UPDATE SET
             summary = EXCLUDED.summary,
             description = EXCLUDED.description,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             attendees = EXCLUDED.attendees,
             location = EXCLUDED.location,
             updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            event.id,
            event.summary || '',
            event.description || '',
            event.start?.dateTime || event.start?.date || null,
            event.end?.dateTime || event.end?.date || null,
            JSON.stringify(event.attendees || []),
            event.location || '',
          ]
        );
      } catch (error) {
        console.error(`Error storing event ${event.id}:`, error);
      }
    }

    console.log(`Calendar sync completed. Processed ${events.length} events`);
    await updateSyncStatus(userId, 'calendar', 'success');
  } catch (error) {
    console.error(`Error syncing Calendar for user ${userId}:`, error);
    await updateSyncStatus(userId, 'calendar', 'error', error.message);
  }
}

async function updateSyncStatus(userId, service, status, error = null) {
  await pool.query(
    `INSERT INTO sync_status (user_id, service, last_sync, status, error)
     VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
     ON CONFLICT (user_id, service)
     DO UPDATE SET
       last_sync = CURRENT_TIMESTAMP,
       status = EXCLUDED.status,
       error = EXCLUDED.error`,
    [userId, service, status, error]
  );
}

async function syncAllForUser(userId) {
  console.log(`Starting full sync for user ${userId}`);

  await Promise.all([
    syncGmailForUser(userId),
    syncHubSpotForUser(userId),
    syncCalendarForUser(userId),
  ]);

  console.log(`Full sync completed for user ${userId}`);
}

module.exports = {
  syncGmailForUser,
  syncHubSpotForUser,
  syncCalendarForUser,
  syncAllForUser,
};
