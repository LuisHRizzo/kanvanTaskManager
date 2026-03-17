const { google } = require('googleapis');

const createGoogleCalendarClient = (tokens) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
};

const createEvent = async (tokens, eventData) => {
  const calendar = createGoogleCalendarClient(tokens);
  
  const event = {
    summary: eventData.title,
    description: eventData.description || '',
    start: {
      dateTime: eventData.startDateTime,
      timeZone: eventData.timezone || 'America/Argentina/Buenos_Aires'
    },
    end: {
      dateTime: eventData.endDateTime,
      timeZone: eventData.timezone || 'America/Argentina/Buenos_Aires'
    },
    attendees: eventData.attendees?.map(email => ({ email })) || [],
    reminders: {
      useDefault: true
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendUpdates: 'all'
  });

  return response.data;
};

const updateEvent = async (tokens, eventId, eventData) => {
  const calendar = createGoogleCalendarClient(tokens);
  
  const event = {
    summary: eventData.title,
    description: eventData.description || '',
    start: {
      dateTime: eventData.startDateTime,
      timeZone: eventData.timezone || 'America/Argentina/Buenos_Aires'
    },
    end: {
      dateTime: eventData.endDateTime,
      timeZone: eventData.timezone || 'America/Argentina/Buenos_Aires'
    },
    attendees: eventData.attendees?.map(email => ({ email })) || []
  };

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: event,
    sendUpdates: 'all'
  });

  return response.data;
};

const deleteEvent = async (tokens, eventId) => {
  const calendar = createGoogleCalendarClient(tokens);
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
    sendUpdates: 'all'
  });
};

const getEvent = async (tokens, eventId) => {
  const calendar = createGoogleCalendarClient(tokens);
  
  const response = await calendar.events.get({
    calendarId: 'primary',
    eventId: eventId
  });

  return response.data;
};

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent
};
