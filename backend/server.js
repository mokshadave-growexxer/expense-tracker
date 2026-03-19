const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/expenses',require('./routes/expenseRoutes'));
app.use('/api/income',  require('./routes/incomeRoutes'));
app.use('/api/budget',  require('./routes/budgetRoutes'));
app.use('/api/ai',      require('./routes/aiRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
// ```

// ---

// ### `backend/.env.example` — MODIFIED (add new vars)
// ```
// PORT=5000
// MONGO_URI=mongodb://localhost:27017/expense-tracker
// JWT_SECRET=your_super_secret_jwt_key_change_in_production
// NODE_ENV=development
// CLIENT_URL=http://localhost:5173

// # Email (Gmail SMTP — use an App Password, not your real password)
// EMAIL_USER=yourname@gmail.com
// EMAIL_PASS=your_gmail_app_password

// # AI (OpenRouter free tier — https://openrouter.ai)
// OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx