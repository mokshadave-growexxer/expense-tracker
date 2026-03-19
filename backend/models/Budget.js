const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthlyLimit: {
      type: Number,
      required: [true, 'Monthly limit is required'],
      min: [1, 'Limit must be greater than 0'],
    },
    month: { type: Number, required: true }, // 0-11
    year:  { type: Number, required: true },
  },
  { timestamps: true }
);

// One budget per user per month/year
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);