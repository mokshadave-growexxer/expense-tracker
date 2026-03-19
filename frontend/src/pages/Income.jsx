import { useState, useEffect, useCallback } from 'react';
import { incomeAPI } from '../services/api';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await incomeAPI.getAll(params);
      setIncomes(data.incomes);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load income');
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(fetchIncome, 300);
    return () => clearTimeout(t);
  }, [fetchIncome]);

  const handleSubmit = async (form) => {
    setSubmitting(true);
    try {
      if (editItem) {
        await incomeAPI.update(editItem._id, form);
        toast.success('Income updated');
      } else {
        await incomeAPI.create(form);
        toast.success('Income added');
      }
      setModalOpen(false);
      setEditItem(null);
      fetchIncome();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await incomeAPI.remove(id);
      toast.success('Income deleted');
      fetchIncome();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteId(null);
    }
  };

  // Monthly breakdown
  const monthlyBreakdown = incomes.reduce((acc, i) => {
    const month = new Date(i.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    acc[month] = (acc[month] || 0) + i.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">Income</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {incomes.length} records · Total: <span className="text-emerald-400 font-mono font-medium">₹{Number(total).toLocaleString('en-IN')}</span>
          </p>
        </div>
        <button onClick={() => { setEditItem(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Income
        </button>
      </div>

      {/* Summary cards */}
      {Object.keys(monthlyBreakdown).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(monthlyBreakdown).slice(0, 4).map(([month, amount]) => (
            <div key={month} className="card p-4">
              <p className="text-xs text-slate-500 mb-1">{month}</p>
              <p className="font-mono text-lg font-semibold text-emerald-400">₹{Number(amount).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="input pl-9" placeholder="Search by source..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input className="input sm:w-44" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input className="input sm:w-44" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          {(search || startDate || endDate) && (
            <button onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }} className="btn-secondary">Clear</button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <span className="text-4xl mb-3">💰</span>
            <p className="text-sm font-medium">No income records yet</p>
            <p className="text-xs mt-1">Add your first income entry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">SOURCE</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-4 hidden md:table-cell">DATE</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-4 hidden lg:table-cell">DESCRIPTION</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-4">AMOUNT</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incomes.map((i) => (
                  <tr key={i._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">💰</div>
                        <p className="text-sm font-medium text-slate-200">{i.source}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-400">
                        {new Date(i.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-slate-500 truncate max-w-[200px] block">
                        {i.description || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-mono text-sm font-semibold text-emerald-400">
                        +₹{Number(i.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditItem(i); setModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(i._id)} disabled={deleteId === i._id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          {deleteId === i._id ? (
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
        type="income"
        initialData={editItem}
        loading={submitting}
      />
    </div>
  );
}
