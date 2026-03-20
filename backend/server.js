const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars FIRST
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ SINGLE AUTH ROUTE - Import both auth routes into one
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');

// Combine them under /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);

// Other routes
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/income', require('./routes/incomeRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/api/health', (req, res) => 
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// Serve static frontend files in production ONLY
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
  });
} else {
  app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));