const jwt = require('jsonwebtoken');
const { User } = require('../models');
const googleOAuthService = require('../services/googleOAuthService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password y name son requeridos' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const user = await User.create({ email, password, name });
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
};

exports.googleAuth = async (req, res) => {
  try {
    const userId = req.user.id;
    const authUrl = googleOAuthService.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=no_user_id`);
    }

    const tokens = await googleOAuthService.getTokens(code);
    const userInfo = await googleOAuthService.getUserInfo(tokens);

    await User.update(
      {
        googleId: userInfo.id,
        googleTokens: tokens,
        googleRefreshToken: tokens.refresh_token,
        email: userInfo.email
      },
      { where: { id: userId } }
    );

    res.redirect(`${process.env.FRONTEND_URL}/settings?google=connected`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=oauth_failed`);
  }
};

exports.googleDisconnect = async (req, res) => {
  try {
    await User.update(
      {
        googleId: null,
        googleTokens: null,
        googleRefreshToken: null,
        googleTaskListId: null
      },
      { where: { id: req.user.id } }
    );

    res.json({ message: 'Google account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.googleStatus = async (req, res) => {
  try {
    const user = req.user;
    console.log('googleStatus - user:', user.id, 'googleId:', user.googleId, 'googleRefreshToken:', user.googleRefreshToken ? 'exists' : 'null');
    const isConnected = !!(user.googleId && user.googleRefreshToken);
    
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      isConnected,
      email: user.email || null,
      taskListId: user.googleTaskListId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};