import { useState, useEffect } from 'react';

const CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'others'];

const CATEGORY_EMOJI = {
  food: '🍔', transport: '🚗', shopping: '🛍️', bills: '📄',
  entertainment: '🎬', health: '💊', others: '📦',
};

export default function TransactionModal({ isOpen, onClose, onSubmit, type, initialData, loading }) {
  const isExpense = type === 'expense';
  const [form, setForm] = useState({
    title: '', source: '', amount: '', category: 'food', date: '', description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title || '',
          source: initialData.source || '',
          amount: initialData.amount || '',
          category: initialData.category || 'food',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
          description: initialData.description || '',
        });
      } else {
        setForm({ title: '', source: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], description: '' });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const e = {};
    if (isExpense && !form.title.trim()) e.title = 'Title is required';
    if (!isExpense && !form.source.trim()) e.source = 'Source is required';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Valid amount is required';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              {initialData ? 'Edit' : 'Add'} {isExpense ? 'Expense' : 'Income'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {initialData ? 'Update the details below' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isExpense ? (
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Lunch at restaurant" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>
          ) : (
            <div>
              <label className="label">Source</label>
              <input className="input" placeholder="e.g. Salary, Freelance" value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })} />
              {errors.source && <p className="text-red-400 text-xs mt-1">{errors.source}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input font-mono" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          {isExpense && (
            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
                      form.category === cat
                        ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}>
                    <span className="text-lg">{CATEGORY_EMOJI[cat]}</span>
                    <span className="capitalize">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Description <span className="text-slate-600">(optional)</span></label>
            <textarea className="input resize-none" rows={2} placeholder="Add a note..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {initialData ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
