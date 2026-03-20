const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Start Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      token: token,
    };
    
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_AUTH_SUCCESS', 
                user: ${JSON.stringify(userData)} 
              }, '${frontendUrl}');
              window.close();
            } else {
              window.location.href = '${frontendUrl}/dashboard';
            }
          </script>
          <p>Login successful! Redirecting...</p>
        </body>
      </html>
    `);
  }
);

module.exports = router;