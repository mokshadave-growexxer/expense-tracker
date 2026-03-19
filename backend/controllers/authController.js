const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Register user — sends verification email
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide all fields' });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'User already exists with this email' });

    const user = new User({ name, email, password });
    const token = user.generateVerificationToken();
    await user.save();

    // Send verification email (non-blocking — don't crash on email failure)
    try {
      const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
      await sendEmail({
        to: email,
        subject: 'Verify your FinTrack account',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#10b981);border-radius:16px;line-height:56px;font-size:28px;font-weight:700;color:#fff;">F</div>
            </div>
            <h2 style="text-align:center;margin:0 0 8px;font-size:22px;">Welcome to FinTrack, ${name}! 🎉</h2>
            <p style="color:#94a3b8;text-align:center;margin:0 0 28px;">Please verify your email to activate your account.</p>
            <div style="text-align:center;">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
                ✅ Verify my account
              </a>
            </div>
            <p style="color:#475569;text-align:center;margin:24px 0 0;font-size:12px;">
              This link expires in 24 hours. If you didn't register, ignore this email.
            </p>
          </div>`,
      });
    } catch (emailErr) {
      console.error('Email send failed (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Verify email via token
// @route   GET /api/auth/verify/:token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    const jwtToken = generateToken(user._id);
    // Redirect to frontend with token
    res.redirect(
      `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/success?token=${jwtToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}`
    );
  } catch (error) {
    res.status(500).json({ message: 'Email verification failed' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isVerified)
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
      });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ message: 'Account already verified' });

    const token = user.generateVerificationToken();
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your FinTrack account',
      html: `<div style="font-family:sans-serif;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px;">
        <h2>Verify your FinTrack account</h2>
        <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;">
          ✅ Verify my account
        </a>
        <p style="color:#475569;font-size:12px;margin-top:20px;">Expires in 24 hours.</p>
      </div>`,
    });

    res.json({ message: 'Verification email resent' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isVerified: req.user.isVerified,
  });
};

module.exports = { register, login, getProfile, verifyEmail, resendVerification };