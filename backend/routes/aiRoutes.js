const express = require('express');
const router = express.Router();
const { analyzeExpenses } = require('../controllers/aiController');
const { processChat } = require('../controllers/aiChatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/analyze-expenses', analyzeExpenses);
router.post('/chat', processChat); // New route for chat

module.exports = router;