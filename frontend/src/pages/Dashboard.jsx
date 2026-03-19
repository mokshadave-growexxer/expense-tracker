import { useState, useEffect, useCallback } from 'react';
import { expenseAPI, incomeAPI } from '../services/api';
import { MonthlyChart, CategoryPieChart, TrendChart } from '../components/ChartSection';
import { useAuth } from '../context/AuthContext';
import BudgetProgressBar from '../components/BudgetProgressBar';
import AIInsightsCard from '../components/AIInsightsCard';

const CATEGORY_COLORS = {
  food: 'text-amber-400', transport: 'text-blue-400', shopping: 'text-purple-400',
  bills: 'text-red-400', entertainment: 'text-pink-400', health: 'text-emerald-400', others: 'text-slate-400',
};

const CATEGORY_EMOJI = {
  food: '🍔', transport: '🚗', shopping: '🛍️', bills: '📄',
  entertainment: '🎬', health: '💊', others: '📦',
};

function StatCard({ label, value, color, icon, change }) {
  return (
    <div className={`stat-card ${color === 'emerald' ? 'glow-emerald' : color === 'red' ? 'glow-red' : 'glow-indigo'}`}>
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg
          ${color === 'emerald' ? 'bg-emerald-500/10' : color === 'red' ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}>
          {icon}
        </div>
      </div>
      <p className={`font-mono text-2xl font-semibold mt-1
        ${color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-indigo-400'}`}>
        ₹{Number(value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, incRes] = await Promise.all([expenseAPI.getAll(), incomeAPI.getAll()]);
      setExpenses(expRes.data.expenses || []);
      setIncomes(incRes.data.incomes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
  const handleTransactionAdded = () => {
    fetchAll();
  };
  
  window.addEventListener('transaction-added', handleTransactionAdded);
  return () => window.removeEventListener('transaction-added', handleTransactionAdded);
}, [fetchAll]); // Add fetchAll to dependency array

  // Stats
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const balance = totalIncome - totalExpense;

  // Category breakdown
  const categoryData = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Monthly data (last 6 months)
  const monthlyData = (() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months[key] = { month: key, income: 0, expense: 0 };
    }
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].expense += e.amount;
    });
    incomes.forEach((i) => {
      const d = new Date(i.date);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (months[key]) months[key].income += i.amount;
    });
    return Object.values(months);
  })();

  const recentTransactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' })),
    ...incomes.map((i) => ({ ...i, type: 'income', title: i.source })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">Here's your financial overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Income" value={totalIncome} color="emerald" icon="💰" />
        <StatCard label="Total Expenses" value={totalExpense} color="red" icon="💸" />
        <StatCard label="Net Balance" value={balance} color={balance >= 0 ? 'indigo' : 'red'} icon="📊" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-white mb-4">Income vs Expenses</h3>
          <MonthlyChart data={monthlyData} />
        </div>
        <div className="card p-6">
          <h3 className="font-display text-base font-semibold text-white mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? <CategoryPieChart data={categoryData} /> : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No expense data yet</div>
          )}
        </div>
      </div>

      {/* Trend + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-white mb-4">Spending Trend</h3>
          <TrendChart data={monthlyData} />
        </div>

        <div className="card p-6 lg:col-span-3">
          <h3 className="font-display text-base font-semibold text-white mb-4">Recent Transactions</h3>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => (
                <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-base">
                      {t.type === 'expense' ? CATEGORY_EMOJI[t.category] || '📦' : '💰'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {t.type === 'expense' && (
                          <span className={`ml-2 capitalize ${CATEGORY_COLORS[t.category] || 'text-slate-400'}`}>
                            {t.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className={`font-mono text-sm font-semibold ${t.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {t.type === 'expense' ? '-' : '+'}₹{Number(t.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    {/* Budget + AI row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetProgressBar />
        <AIInsightsCard />
      </div>
    </div>
  );
}
