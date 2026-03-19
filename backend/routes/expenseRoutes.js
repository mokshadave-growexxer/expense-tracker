const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, updateExpense, deleteExpense, exportExpensesCSV } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Export must come BEFORE /:id to avoid route collision
router.get('/export', exportExpensesCSV);
router.route('/').get(getExpenses).post(addExpense);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;