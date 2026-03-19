const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc  Set or update monthly budget
// @route POST /api/budget
const setBudget = async (req, res) => {
  try {
    const { monthlyLimit, month, year } = req.body;
    if (!monthlyLimit || monthlyLimit <= 0)
      return res.status(400).json({ message: 'Monthly limit must be greater than 0' });

    const now = new Date();
    const m = month !== undefined ? Number(month) : now.getMonth();
    const y = year !== undefined ? Number(year) : now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, month: m, year: y },
      { monthlyLimit: Number(monthlyLimit) },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: 'Failed to set budget' });
  }
};

// @desc  Get current month budget + spending
// @route GET /api/budget/current
const getCurrentBudget = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const budget = await Budget.findOne({ userId: req.user._id, month, year });

    // Get total spending this month
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      budget: budget || null,
      spent,
      month,
      year,
      percentage: budget ? Math.min((spent / budget.monthlyLimit) * 100, 100) : 0,
      isOverBudget: budget ? spent > budget.monthlyLimit : false,
      isNearLimit: budget ? spent / budget.monthlyLimit >= 0.8 : false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch budget' });
  }
};

module.exports = { setBudget, getCurrentBudget };