const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Google OAuth callback - called from frontend after Google auth
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    } else {
      // Create new user with Google data
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture,
        isVerified: true, // Google users are automatically verified
        password: Math.random().toString(36).slice(-16), // Random password (won't be used)
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

module.exports = { googleAuth };