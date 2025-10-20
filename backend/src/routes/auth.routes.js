const express = require('express');
const passport = require('../config/passport');
const axios = require('axios');
const pool = require('../config/database');

const router = express.Router();

// Google OAuth
router.get('/google', passport.authenticate('google'));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
);

// HubSpot OAuth
router.get('/hubspot', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated with Google first' });
  }

  // Scopes must match EXACTLY with HubSpot app configuration
  const scopes = [
    'crm.objects.companies.read',
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.deals.read',
    'crm.schemas.contacts.read',
    'crm.schemas.contacts.write'
  ];
  
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;

  res.redirect(authUrl);
});

router.get('/hubspot/callback', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for access token
    const response = await axios.post(
      'https://api.hubapi.com/oauth/v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const tokens = response.data;

    // Store tokens
    await pool.query(
      'UPDATE users SET hubspot_tokens = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(tokens), req.user.id]
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/success?hubspot=true`);
  } catch (error) {
    console.error('Error exchanging HubSpot code:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
});

// Check auth status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    const hasHubSpot = req.user.hubspot_tokens !== null;
    res.json({
      authenticated: true,
      email: req.user.email,
      hasHubSpot,
      userId: req.user.id,
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
