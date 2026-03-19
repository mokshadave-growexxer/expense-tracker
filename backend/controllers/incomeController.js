const Income = require('../models/Income');

// @desc    Get all income for user
// @route   GET /api/income
const getIncome = async (req, res) => {
  try {
    const { startDate, endDate, search, sort = '-date' } = req.query;

    const filter = { userId: req.user._id };

    if (search) filter.source = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const incomes = await Income.find(filter).sort(sort);
    const total = incomes.reduce((sum, i) => sum + i.amount, 0);

    res.json({ incomes, total, count: incomes.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch income' });
  }
};

// @desc    Add income
// @route   POST /api/income
const addIncome = async (req, res) => {
  try {
    const { source, amount, date, description } = req.body;

    if (!source || !amount) {
      return res.status(400).json({ message: 'Source and amount are required' });
    }

    const income = await Income.create({
      source,
      amount: Number(amount),
      date: date || Date.now(),
      description,
      userId: req.user._id,
    });

    res.status(201).json(income);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to add income' });
  }
};

// @desc    Update income
// @route   PUT /api/income/:id
const updateIncome = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    const { source, amount, date, description } = req.body;

    income.source = source || income.source;
    income.amount = amount !== undefined ? Number(amount) : income.amount;
    income.date = date || income.date;
    income.description = description !== undefined ? description : income.description;

    const updated = await income.save();
    res.json(updated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update income' });
  }
};

// @desc    Delete income
// @route   DELETE /api/income/:id
const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    res.json({ message: 'Income deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete income' });
  }
};

module.exports = { getIncome, addIncome, updateIncome, deleteIncome };
