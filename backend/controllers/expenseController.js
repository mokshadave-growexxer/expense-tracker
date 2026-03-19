const Expense = require('../models/Expense');

const buildFilter = (userId, query) => {
  const { category, startDate, endDate, minAmount, maxAmount, search } = query;
  const filter = { userId };
  if (category && category !== 'all') filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }
  return filter;
};

// @desc    Get all expenses for user
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { sort = '-date' } = req.query;
    const filter = buildFilter(req.user._id, req.query);
    const expenses = await Expense.find(filter).sort(sort);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ expenses, total, count: expenses.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

// @desc    Export expenses as CSV
// @route   GET /api/expenses/export
const exportExpensesCSV = async (req, res) => {
  try {
    const filter = buildFilter(req.user._id, req.query);
    const expenses = await Expense.find(filter).sort('-date');

    const escape = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = [
      ['Date', 'Title', 'Category', 'Amount', 'Description'],
      ...expenses.map((e) => [
        new Date(e.date).toLocaleDateString('en-IN'),
        escape(e.title),
        escape(e.category),
        e.amount.toFixed(2),
        escape(e.description || ''),
      ]),
    ];

    const csv = rows.map((r) => r.join(',')).join('\n');
    const filename = `expenses-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export expenses' });
  }
};

// @desc    Add expense
// @route   POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;
    if (!title || !amount || !category)
      return res.status(400).json({ message: 'Title, amount and category are required' });

    const expense = await Expense.create({
      title, amount: Number(amount), category,
      date: date || Date.now(), description, userId: req.user._id,
    });
    res.status(201).json(expense);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to add expense' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const { title, amount, category, date, description } = req.body;
    expense.title = title || expense.title;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.date = date || expense.date;
    expense.description = description !== undefined ? description : expense.description;

    const updated = await expense.save();
    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update expense' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete expense' });
  }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense, exportExpensesCSV };