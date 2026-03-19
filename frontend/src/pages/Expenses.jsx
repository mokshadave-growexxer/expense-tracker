import { useState, useEffect, useCallback } from 'react';
import { expenseAPI } from '../services/api';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';
import ExportCSVButton from '../components/ExportCSVButton';

const CATEGORIES = ['all', 'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'others'];

const CATEGORY_COLORS = {
  food: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  transport: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  shopping: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  bills: 'bg-red-500/10 text-red-400 border-red-500/30',
  entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  health: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  others: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const CATEGORY_EMOJI = {
  food: '🍔', transport: '🚗', shopping: '🛍️', bills: '📄',
  entertainment: '🎬', health: '💊', others: '📦',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await expenseAPI.getAll(params);
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [search, category, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(t);
  }, [fetchExpenses]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await expenseAPI.update(editItem._id, form);
        toast.success('Expense updated');
      } else {
        await expenseAPI.create(form);
        toast.success('Expense added');
      }
      setModalOpen(false);
      setEditItem(null);
      fetchExpenses();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await expenseAPI.remove(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  const clearFilters = () => { setSearch(''); setCategory('all'); setStartDate(''); setEndDate(''); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Expenses</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {expenses.length} transactions · Total: <span className="text-red-400 font-mono font-medium">₹{Number(total).toLocaleString('en-IN')}</span>
          </p>
        </div>
                <div className="flex items-center gap-3">
          <ExportCSVButton filters={{ search, category, startDate, endDate }} />
          <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Expense
          </button>
        </div>

      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="input pl-9" placeholder="Search expenses..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input className="input sm:w-44" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="From" />
          <input className="input sm:w-44" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="To" />
          {(search || category !== 'all' || startDate || endDate) && (
            <button onClick={clearFilters} className="btn-secondary whitespace-nowrap">Clear</button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                category === cat
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:border-slate-600'
              }`}>
              {cat !== 'all' && CATEGORY_EMOJI[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <span className="text-4xl mb-3">💸</span>
            <p className="text-sm font-medium">No expenses found</p>
            <p className="text-xs mt-1">Try adjusting your filters or add a new expense</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">TITLE</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-4 hidden sm:table-cell">CATEGORY</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-4 hidden md:table-cell">DATE</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-4">AMOUNT</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{CATEGORY_EMOJI[e.category] || '📦'}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{e.title}</p>
                          {e.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{e.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`badge border capitalize ${CATEGORY_COLORS[e.category] || 'text-slate-400'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-400">
                        {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm font-semibold text-red-400">
                        -₹{Number(e.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(e); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(e._id)} disabled={deleteId === e._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          {deleteId === e._id ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={handleSubmit}
        type="expense"
        initialData={editItem}
        loading={submitting}
      />
    </div>
  );
}
