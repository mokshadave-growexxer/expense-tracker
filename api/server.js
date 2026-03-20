const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('../backend/routes/authRoutes');
const expenseRoutes = require('../backend/routes/expenseRoutes');
const incomeRoutes = require('../backend/routes/incomeRoutes');
const budgetRoutes = require('../backend/routes/budgetRoutes');
const aiRoutes = require('../backend/routes/aiRoutes');

const app = express();

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB Connection (cached for serverless)
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) return cachedDb;
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedDb = conn;
    console.log('✅ MongoDB Connected');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Connect to DB on every request (necessary for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;