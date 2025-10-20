const { google } = require('googleapis');

function getCalendarClient(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

async function listEvents(tokens, timeMin = null, timeMax = null, maxResults = 50) {
  const calendar = getCalendarClient(tokens);

  try {
    const params = {
      calendarId: 'primary',
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const response = await calendar.events.list(params);
    return response.data.items || [];
  } catch (error) {
    console.error('Error listing calendar events:', error);
    throw error;
  }
}

async function createEvent(tokens, eventData) {
  const calendar = getCalendarClient(tokens);

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

async function updateEvent(tokens, eventId, eventData) {
  const calendar = getCalendarClient(tokens);

  try {
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: eventData,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

async function deleteEvent(tokens, eventId) {
  const calendar = getCalendarClient(tokens);

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
}

async function getFreeBusy(tokens, timeMin, timeMax, emails = []) {
  const calendar = getCalendarClient(tokens);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }, ...emails.map(email => ({ id: email }))],
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting free/busy info:', error);
    throw error;
  }
}

async function getAvailableSlots(tokens, startDate, endDate, durationMinutes = 60) {
  try {
    const events = await listEvents(tokens, startDate, endDate);
    const freeBusy = await getFreeBusy(tokens, startDate, endDate);

    // Parse busy periods
    const busyPeriods = freeBusy.calendars.primary.busy.map(period => ({
      start: new Date(period.start),
      end: new Date(period.end),
    }));

    // Generate available slots (9 AM - 5 PM, weekdays)
    const slots = [];
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate < endDateTime) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (let hour = 9; hour < 17; hour++) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Check if slot conflicts with busy periods
          const isBusy = busyPeriods.some(busy =>
            (slotStart >= busy.start && slotStart < busy.end) ||
            (slotEnd > busy.start && slotEnd <= busy.end) ||
            (slotStart <= busy.start && slotEnd >= busy.end)
          );

          if (!isBusy && slotEnd.getHours() <= 17) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}

module.exports = {
  getCalendarClient,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getFreeBusy,
  getAvailableSlots,
};
