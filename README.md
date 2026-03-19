# FinTrack — MERN Expense Tracker

A full-stack personal finance manager built with **MongoDB, Express.js, React.js, and Node.js**.

## Features

- **Auth**: JWT registration, login, protected routes, bcrypt password hashing
- **Dashboard**: Balance overview, income vs expense charts, spending trends, recent transactions
- **Expenses**: Add/edit/delete with category filtering, date range, and search
- **Income**: Full CRUD with monthly breakdown
- **Charts**: Monthly bar chart, category pie chart, spending trend line (Recharts)
- **UI**: Dark theme, responsive design, Tailwind CSS, toast notifications

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   └── incomeController.js
│   ├── middleware/authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── Income.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   └── incomeRoutes.js
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── ChartSection.jsx
    │   │   └── TransactionModal.jsx
    │   ├── context/AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Expenses.jsx
    │   │   └── Income.jsx
    │   ├── services/api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** (local install or MongoDB Atlas free tier)
- **npm** v9+

---

## Setup Instructions

### 1. Clone / Extract the project

```bash
cd expense-tracker
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=change_this_to_a_long_random_secret_string
NODE_ENV=development
```

> **Using MongoDB Atlas?** Replace `MONGO_URI` with your Atlas connection string:
> `MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/expense-tracker`

Start the backend:
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Open in browser

Visit `http://localhost:5173` → Register → Start tracking!

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile (protected) |

### Expenses (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses (with filters) |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

**Expense query params:** `?search=&category=&startDate=&endDate=&minAmount=&maxAmount=&sort=`

### Income (all protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/income` | Get all income |
| POST | `/api/income` | Add income |
| PUT | `/api/income/:id` | Update income |
| DELETE | `/api/income/:id` | Delete income |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Axios, Recharts, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Dev Tools | Vite, Nodemon |

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your_secret_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (optional `frontend/.env`)
```
VITE_API_URL=/api
```

---

## Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from backend (add to server.js):
# app.use(express.static(path.join(__dirname, '../frontend/dist')))
```

---

## Troubleshooting

**MongoDB connection error:**
- Ensure MongoDB is running: `mongod` (local) or check Atlas IP whitelist
- Verify `MONGO_URI` in `.env`

**Port already in use:**
- Change `PORT` in backend `.env`
- Frontend port: edit `vite.config.js` → `server.port`

**CORS errors:**
- Ensure `CLIENT_URL` in backend `.env` matches your frontend URL
