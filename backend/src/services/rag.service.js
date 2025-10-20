const pool = require('../config/database');
const { createEmbedding } = require('./openai.service');

async function storeEmail(userId, emailData) {
  try {
    // Truncate content to prevent token limit errors
    // OpenAI embedding model has 8192 token limit (~32000 chars)
    const maxLength = 30000;
    const content = emailData.content || '';
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + '...[truncated]' 
      : content;
    
    // Create searchable text
    const searchText = `
      Subject: ${emailData.subject}
      From: ${emailData.from}
      Content: ${truncatedContent}
      Snippet: ${emailData.snippet}
    `.trim();

    const embedding = await createEmbedding(searchText);

    // Parse from field
    const fromMatch = emailData.from.match(/(.*?)\s*<(.+?)>/);
    const fromName = fromMatch ? fromMatch[1].trim().replace(/"/g, '') : emailData.from;
    const fromEmail = fromMatch ? fromMatch[2] : emailData.from;

    await pool.query(
      `INSERT INTO emails
       (user_id, email_id, thread_id, subject, from_email, from_name, to_emails,
        content, snippet, date, labels, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (email_id)
       DO UPDATE SET
         subject = EXCLUDED.subject,
         content = EXCLUDED.content,
         embedding = EXCLUDED.embedding`,
      [
        userId,
        emailData.id,
        emailData.threadId,
        emailData.subject,
        fromEmail,
        fromName,
        [emailData.to],
        emailData.content,
        emailData.snippet,
        emailData.date,
        emailData.labels,
        JSON.stringify(embedding),
      ]
    );
  } catch (error) {
    console.error('Error storing email:', error);
    throw error;
  }
}

async function storeHubSpotContact(userId, contactData) {
  try {
    const searchText = `
      Name: ${contactData.properties.firstname || ''} ${contactData.properties.lastname || ''}
      Email: ${contactData.properties.email || ''}
      Company: ${contactData.properties.company || ''}
      Phone: ${contactData.properties.phone || ''}
    `.trim();

    const embedding = await createEmbedding(searchText);

    await pool.query(
      `INSERT INTO hubspot_contacts
       (user_id, contact_id, email, first_name, last_name, company, phone, properties, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (contact_id)
       DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         company = EXCLUDED.company,
         phone = EXCLUDED.phone,
         properties = EXCLUDED.properties,
         embedding = EXCLUDED.embedding,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        contactData.id,
        contactData.properties.email || null,
        contactData.properties.firstname || null,
        contactData.properties.lastname || null,
        contactData.properties.company || null,
        contactData.properties.phone || null,
        contactData.properties,
        JSON.stringify(embedding),
      ]
    );
  } catch (error) {
    console.error('Error storing HubSpot contact:', error);
    throw error;
  }
}

async function storeHubSpotNote(userId, noteData, contactId) {
  try {
    const searchText = noteData.properties.hs_note_body || '';
    const embedding = await createEmbedding(searchText);

    await pool.query(
      `INSERT INTO hubspot_notes
       (user_id, note_id, contact_id, content, created_date, embedding)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (note_id)
       DO UPDATE SET
         content = EXCLUDED.content,
         embedding = EXCLUDED.embedding`,
      [
        userId,
        noteData.id,
        contactId,
        searchText,
        new Date(noteData.properties.hs_timestamp),
        JSON.stringify(embedding),
      ]
    );
  } catch (error) {
    console.error('Error storing HubSpot note:', error);
    throw error;
  }
}

async function searchEmails(userId, query, limit = 5) {
  try {
    const embedding = await createEmbedding(query);

    const result = await pool.query(
      `SELECT
         email_id, subject, from_name, from_email, content, snippet, date,
         1 - (embedding <=> $1::vector) as similarity
       FROM emails
       WHERE user_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [JSON.stringify(embedding), userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

async function searchContacts(userId, query, limit = 5) {
  try {
    const embedding = await createEmbedding(query);

    const result = await pool.query(
      `SELECT
         contact_id, email, first_name, last_name, company, phone, properties,
         1 - (embedding <=> $1::vector) as similarity
       FROM hubspot_contacts
       WHERE user_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [JSON.stringify(embedding), userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw error;
  }
}

async function searchNotes(userId, query, limit = 5) {
  try {
    const embedding = await createEmbedding(query);

    const result = await pool.query(
      `SELECT
         n.note_id, n.contact_id, n.content, n.created_date,
         c.first_name, c.last_name, c.email,
         1 - (n.embedding <=> $1::vector) as similarity
       FROM hubspot_notes n
       LEFT JOIN hubspot_contacts c ON n.contact_id = c.contact_id
       WHERE n.user_id = $2
       ORDER BY n.embedding <=> $1::vector
       LIMIT $3`,
      [JSON.stringify(embedding), userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
}

async function searchAll(userId, query, limit = 3) {
  try {
    const [emails, contacts, notes] = await Promise.all([
      searchEmails(userId, query, limit),
      searchContacts(userId, query, limit),
      searchNotes(userId, query, limit),
    ]);

    return {
      emails,
      contacts,
      notes,
    };
  } catch (error) {
    console.error('Error searching all sources:', error);
    throw error;
  }
}

module.exports = {
  storeEmail,
  storeHubSpotContact,
  storeHubSpotNote,
  searchEmails,
  searchContacts,
  searchNotes,
  searchAll,
};
