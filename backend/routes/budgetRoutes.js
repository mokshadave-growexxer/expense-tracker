const express = require('express');
const router = express.Router();
const { setBudget, getCurrentBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', setBudget);
router.get('/current', getCurrentBudget);

module.exports = router;