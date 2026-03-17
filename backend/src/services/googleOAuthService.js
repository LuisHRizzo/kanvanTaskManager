const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const getAuthUrl = (userId) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId,
    prompt: 'consent'
  });
};

const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

const refreshTokenIfNeeded = async (tokens) => {
  if (!tokens.refresh_token) {
    return tokens;
  }

  oauth2Client.setCredentials(tokens);
  
  const isTokenExpired = oauth2Client.isTokenExpiring();
  
  if (isTokenExpired) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  }
  
  return tokens;
};

const getUserInfo = async (tokens) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials(tokens);
  
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const userInfo = await oauth2.userinfo.get();
  
  return userInfo.data;
};

module.exports = {
  oauth2Client,
  getAuthUrl,
  getTokens,
  setCredentials,
  refreshTokenIfNeeded,
  getUserInfo,
  SCOPES
};
