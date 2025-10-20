const { chat } = require('./openai.service');
const { searchAll } = require('./rag.service');
const gmailService = require('./gmail.service');
const calendarService = require('./calendar.service');
const hubspotService = require('./hubspot.service');
const pool = require('../config/database');
const { addDays, addHours, format } = require('date-fns');

// Define available tools for the AI agent
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description:
        'Search through emails, HubSpot contacts, and notes to find relevant information. Use this when the user asks about clients, past conversations, or specific details.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to a recipient. Can optionally reply to an existing thread.',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Email subject',
          },
          body: {
            type: 'string',
            description: 'Email body content',
          },
          thread_id: {
            type: 'string',
            description: 'Optional: Gmail thread ID to reply to an existing conversation',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_times',
      description: 'Get available time slots from the calendar for scheduling meetings',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            description: 'Start date in ISO format (e.g., 2025-10-20T00:00:00Z)',
          },
          end_date: {
            type: 'string',
            description: 'End date in ISO format',
          },
          duration_minutes: {
            type: 'number',
            description: 'Meeting duration in minutes (default: 60)',
          },
        },
        required: ['start_date', 'end_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a new calendar event',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Event title/summary',
          },
          start_time: {
            type: 'string',
            description: 'Event start time in ISO format',
          },
          end_time: {
            type: 'string',
            description: 'Event end time in ISO format',
          },
          attendees: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of attendee email addresses',
          },
          description: {
            type: 'string',
            description: 'Event description',
          },
        },
        required: ['summary', 'start_time', 'end_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_hubspot_contacts',
      description: 'Search for contacts in HubSpot by name or email',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (name or email)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_hubspot_contact',
      description: 'Create a new contact in HubSpot',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Contact email',
          },
          firstname: {
            type: 'string',
            description: 'First name',
          },
          lastname: {
            type: 'string',
            description: 'Last name',
          },
          company: {
            type: 'string',
            description: 'Company name',
          },
          phone: {
            type: 'string',
            description: 'Phone number',
          },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_hubspot_note',
      description: 'Add a note to a HubSpot contact',
      parameters: {
        type: 'object',
        properties: {
          contact_id: {
            type: 'string',
            description: 'HubSpot contact ID',
          },
          note: {
            type: 'string',
            description: 'Note content',
          },
        },
        required: ['contact_id', 'note'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'Create a task that requires waiting for external events (like waiting for an email reply). The task will be resumed when relevant events occur.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Task description',
          },
          context: {
            type: 'object',
            description: 'Context data needed to complete the task later',
          },
        },
        required: ['description', 'context'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_emails',
      description: 'Search emails using Gmail search syntax',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Gmail search query (e.g., "from:john@example.com", "subject:meeting")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: 'Get upcoming calendar events',
      parameters: {
        type: 'object',
        properties: {
          days_ahead: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7)',
          },
        },
      },
    },
  },
];

// Execute tool calls
async function executeToolCall(toolName, args, user) {
  console.log(`Executing tool: ${toolName}`, args);

  // Parse tokens if they're stored as strings
  const googleTokens = typeof user.google_tokens === 'string' 
    ? JSON.parse(user.google_tokens) 
    : user.google_tokens;
  const hubspotToken = (typeof user.hubspot_tokens === 'string'
    ? JSON.parse(user.hubspot_tokens)
    : user.hubspot_tokens)?.access_token;

  try {
    switch (toolName) {
      case 'search_knowledge_base': {
        const results = await searchAll(user.id, args.query, 3);
        return {
          emails: results.emails.map((e) => ({
            subject: e.subject,
            from: `${e.from_name} <${e.from_email}>`,
            date: e.date,
            snippet: e.snippet,
            similarity: e.similarity,
          })),
          contacts: results.contacts.map((c) => ({
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            email: c.email,
            company: c.company,
            phone: c.phone,
          })),
          notes: results.notes.map((n) => ({
            contact: `${n.first_name || ''} ${n.last_name || ''}`.trim(),
            content: n.content,
            date: n.created_date,
          })),
        };
      }

      case 'send_email': {
        const result = await gmailService.sendEmail(googleTokens, {
          to: args.to,
          subject: args.subject,
          body: args.body,
          threadId: args.thread_id,
        });
        return { success: true, messageId: result.id };
      }

      case 'get_available_times': {
        const slots = await calendarService.getAvailableSlots(
          googleTokens,
          args.start_date,
          args.end_date,
          args.duration_minutes || 60
        );
        return { availableSlots: slots.slice(0, 10) }; // Return first 10 slots
      }

      case 'create_calendar_event': {
        const eventData = {
          summary: args.summary,
          start: {
            dateTime: args.start_time,
            timeZone: 'America/Denver',
          },
          end: {
            dateTime: args.end_time,
            timeZone: 'America/Denver',
          },
        };

        if (args.description) {
          eventData.description = args.description;
        }

        if (args.attendees && args.attendees.length > 0) {
          eventData.attendees = args.attendees.map((email) => ({ email }));
        }

        const event = await calendarService.createEvent(googleTokens, eventData);
        return {
          success: true,
          eventId: event.id,
          htmlLink: event.htmlLink,
        };
      }

      case 'search_hubspot_contacts': {
        if (!hubspotToken) {
          return { error: 'HubSpot not connected' };
        }
        const contacts = await hubspotService.searchContacts(hubspotToken, args.query);
        return {
          contacts: contacts.map((c) => ({
            id: c.id,
            email: c.properties.email,
            firstname: c.properties.firstname,
            lastname: c.properties.lastname,
            company: c.properties.company,
            phone: c.properties.phone,
          })),
        };
      }

      case 'create_hubspot_contact': {
        if (!hubspotToken) {
          return { error: 'HubSpot not connected' };
        }
        const contact = await hubspotService.createContact(hubspotToken, args);
        return {
          success: true,
          contactId: contact.id,
          email: contact.properties.email,
        };
      }

      case 'add_hubspot_note': {
        if (!hubspotToken) {
          return { error: 'HubSpot not connected' };
        }
        const note = await hubspotService.createNote(
          hubspotToken,
          args.contact_id,
          args.note
        );
        return { success: true, noteId: note.id };
      }

      case 'create_task': {
        const result = await pool.query(
          `INSERT INTO tasks (user_id, description, context, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING *`,
          [user.id, args.description, JSON.stringify(args.context)]
        );
        return { success: true, taskId: result.rows[0].id };
      }

      case 'search_emails': {
        const emails = await gmailService.searchEmails(googleTokens, args.query);
        return {
          emails: emails.map((e) => ({
            id: e.id,
            subject: e.subject,
            from: e.from,
            date: e.date,
            snippet: e.snippet,
          })),
        };
      }

      case 'get_upcoming_events': {
        const daysAhead = args.days_ahead || 7;
        const now = new Date();
        const future = addDays(now, daysAhead);

        const events = await calendarService.listEvents(
          googleTokens,
          now.toISOString(),
          future.toISOString()
        );

        return {
          events: events.map((e) => ({
            id: e.id,
            summary: e.summary,
            start: e.start.dateTime || e.start.date,
            end: e.end.dateTime || e.end.date,
            attendees: e.attendees?.map((a) => a.email) || [],
          })),
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: error.message };
  }
}

// Main agent function
async function runAgent(userId, conversationId, userMessage) {
  try {
    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    // Get conversation history
    const messagesResult = await pool.query(
      `SELECT role, content, tool_calls, tool_call_id, name
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    const conversationHistory = messagesResult.rows.map((msg) => {
      const message = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.tool_calls) {
        message.tool_calls = msg.tool_calls;
      }

      if (msg.tool_call_id) {
        message.tool_call_id = msg.tool_call_id;
      }

      if (msg.name) {
        message.name = msg.name;
      }

      return message;
    });

    // Get ongoing instructions
    const instructionsResult = await pool.query(
      'SELECT instruction FROM ongoing_instructions WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const ongoingInstructions = instructionsResult.rows.map((r) => r.instruction);

    // Build system message
    let systemMessage = `You are an AI assistant for a financial advisor. You help manage client communications, schedule meetings, and maintain client information.

You have access to:
- Gmail for reading and sending emails
- Google Calendar for scheduling and checking availability
- HubSpot CRM for managing contacts and notes

Current date and time: ${new Date().toISOString()}

When users ask you to schedule meetings:
1. Search for the contact to get their email
2. Get available time slots from the calendar
3. Send an email proposing 3-5 available times
4. When they reply with their choice, create the calendar event
5. Confirm with them and add a note to HubSpot

Be proactive and helpful. When you need more information, ask clarifying questions.`;

    if (ongoingInstructions.length > 0) {
      systemMessage += `\n\nOngoing instructions you should follow:\n${ongoingInstructions
        .map((inst, i) => `${i + 1}. ${inst}`)
        .join('\n')}`;
    }

    // Add user message
    await pool.query(
      `INSERT INTO messages (conversation_id, role, content)
       VALUES ($1, $2, $3)`,
      [conversationId, 'user', userMessage]
    );

    // Build messages array
    const messages = [
      { role: 'system', content: systemMessage },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    // Run agent loop (max 10 iterations to prevent infinite loops)
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      // Call OpenAI
      const assistantMessage = await chat(messages, tools, userId);

      // Save assistant message
      await pool.query(
        `INSERT INTO messages (conversation_id, role, content, tool_calls)
         VALUES ($1, $2, $3, $4)`,
        [conversationId, 'assistant', assistantMessage.content || '', JSON.stringify(assistantMessage.tool_calls || null)]
      );

      messages.push(assistantMessage);

      // Check if we need to execute tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute all tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          const result = await executeToolCall(toolName, toolArgs, user);

          // Save tool result
          const toolMessage = {
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolName,
            content: JSON.stringify(result),
          };

          await pool.query(
            `INSERT INTO messages (conversation_id, role, content, tool_call_id, name)
             VALUES ($1, $2, $3, $4, $5)`,
            [conversationId, 'tool', toolMessage.content, toolCall.id, toolName]
          );

          messages.push(toolMessage);
        }

        // Continue loop to get next assistant response
        continue;
      }

      // No tool calls, we're done
      return {
        content: assistantMessage.content,
        done: true,
      };
    }

    // Max iterations reached
    return {
      content: 'I apologize, but I need to stop here. The task is taking longer than expected. Please try breaking it into smaller steps.',
      done: true,
    };
  } catch (error) {
    console.error('Error in agent:', error);
    throw error;
  }
}

module.exports = {
  runAgent,
  executeToolCall,
  tools,
};
