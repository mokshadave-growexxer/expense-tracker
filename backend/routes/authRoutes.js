const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyEmail, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;