import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function BudgetProgressBar() {
  const [data, setData]       = useState(null);
  const [editing, setEditing] = useState(false);
  const [limit, setLimit]     = useState('');
  const [saving, setSaving]   = useState(false);

  const fetchBudget = async () => {
    try {
      const { data: d } = await api.get('/budget/current');
      setData(d);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchBudget(); }, []);

  const handleSave = async () => {
    if (!limit || isNaN(limit) || Number(limit) <= 0)
      return toast.error('Enter a valid budget amount');
    setSaving(true);
    try {
      await api.post('/budget', { monthlyLimit: Number(limit) });
      toast.success('Budget updated!');
      setEditing(false);
      setLimit('');
      fetchBudget();
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const pct = data?.percentage ?? 0;
  const barColor = pct >= 100
    ? 'bg-red-500'
    : pct >= 80
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-semibold text-white dark-text">
            Monthly Budget
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{monthName}</p>
        </div>
        <button
          onClick={() => { setEditing((e) => !e); setLimit(data?.budget?.monthlyLimit || ''); }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          {editing ? 'Cancel' : data?.budget ? 'Edit' : '+ Set Budget'}
        </button>
      </div>

      {editing && (
        <div className="flex gap-2 mb-4">
          <input
            className="input text-sm py-2"
            type="number"
            min="1"
            placeholder="Monthly limit (₹)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
            {saving ? '...' : 'Save'}
          </button>
        </div>
      )}

      {data?.budget ? (
        <>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">
              Spent: <span className="font-mono font-semibold text-slate-200">₹{Number(data.spent).toLocaleString('en-IN')}</span>
            </span>
            <span className="text-slate-400">
              Limit: <span className="font-mono font-semibold text-slate-200">₹{Number(data.budget.monthlyLimit).toLocaleString('en-IN')}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs font-medium ${
              pct >= 100 ? 'text-red-400' : pct >= 80 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {pct.toFixed(0)}% used
            </span>
            {data.isOverBudget && (
              <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                🚨 Over budget by ₹{(data.spent - data.budget.monthlyLimit).toLocaleString('en-IN')}
              </span>
            )}
            {data.isNearLimit && !data.isOverBudget && (
              <span className="text-xs text-amber-400 font-medium">⚠️ Nearing limit</span>
            )}
          </div>
        </>
      ) : (
        !editing && (
          <p className="text-slate-500 text-sm text-center py-2">
            No budget set for this month.
          </p>
        )
      )}
    </div>
  );
}