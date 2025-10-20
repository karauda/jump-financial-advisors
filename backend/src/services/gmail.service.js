const { google } = require('googleapis');
const pool = require('../config/database');

function getGmailClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function listEmails(tokens, maxResults = 100, pageToken = null) {
  const gmail = getGmailClient(tokens);

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
    });

    return response.data;
  } catch (error) {
    console.error('Error listing emails:', error);
    throw error;
  }
}

async function getEmail(tokens, messageId) {
  const gmail = getGmailClient(tokens);

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    return parseEmailMessage(response.data);
  } catch (error) {
    console.error('Error getting email:', error);
    throw error;
  }
}

function parseEmailMessage(message) {
  const headers = message.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header ? header.value : '';
  };

  let content = '';
  if (message.payload.body.data) {
    content = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload.parts) {
    const textPart = message.payload.parts.find(
      (part) => part.mimeType === 'text/plain'
    );
    if (textPart && textPart.body.data) {
      content = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader('Subject'),
    from: getHeader('From'),
    to: getHeader('To'),
    date: new Date(parseInt(message.internalDate)),
    snippet: message.snippet,
    content,
    labels: message.labelIds || [],
  };
}

async function sendEmail(tokens, { to, subject, body, threadId = null }) {
  const gmail = getGmailClient(tokens);

  try {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const params = {
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    };

    if (threadId) {
      params.requestBody.threadId = threadId;
    }

    const response = await gmail.users.messages.send(params);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function searchEmails(tokens, query) {
  const gmail = getGmailClient(tokens);

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    if (!response.data.messages) {
      return [];
    }

    const emails = await Promise.all(
      response.data.messages.map((msg) => getEmail(tokens, msg.id))
    );

    return emails;
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

async function watchGmailInbox(tokens, topicName) {
  const gmail = getGmailClient(tokens);

  try {
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error setting up Gmail watch:', error);
    throw error;
  }
}

module.exports = {
  getGmailClient,
  listEmails,
  getEmail,
  sendEmail,
  searchEmails,
  watchGmailInbox,
};
