import { useState } from 'react';
import api from '../services/api';

export default function AIInsightsCard() {
  const [analysis, setAnalysis] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis('');
    setDone(false);
    try {
      const { data } = await api.post('/ai/analyze-expenses');
      setAnalysis(data.analysis);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-lite renderer (bold + bullets)
  const renderAnalysis = (text) =>
    text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <p
          key={i}
          className={`text-sm leading-relaxed ${
            line.trim() === '' ? 'my-1' : 'text-slate-300'
          }`}
          dangerouslySetInnerHTML={{ __html: bold }}
        />
      );
    });

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg">🤖</div>
          <div>
            <h3 className="font-display text-base font-semibold text-white">AI Insights</h3>
            <p className="text-xs text-slate-500">Powered by AI expense analysis</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary text-sm py-2 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              {done ? 'Re-analyze' : 'Analyze my expenses'}
            </>
          )}
        </button>
      </div>

      {!analysis && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <span className="text-3xl mb-2">✨</span>
          <p className="text-sm text-center">
            Click "Analyze" to get AI-powered insights<br />about your spending patterns
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Analyzing your expenses...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className="bg-slate-800/40 rounded-xl p-4 space-y-1 animate-fade-in">
          {renderAnalysis(analysis)}
        </div>
      )}
    </div>
  );
}