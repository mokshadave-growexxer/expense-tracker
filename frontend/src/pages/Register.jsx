import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [sent, setSent]       = useState(false);
  const [resending, setResending] = useState(false);
  const { register }          = useAuth();

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authAPI.resendVerification(form.email);
      toast.success('Verification email resent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-display font-bold text-3xl mb-4">F</div>
        </div>
        <div className="card p-8">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm mb-6">
            We sent a verification link to <span className="text-indigo-400 font-medium">{form.email}</span>.
            Click the link to activate your account.
          </p>
          <div className="space-y-3">
            <button onClick={handleResend} disabled={resending}
              className="btn-secondary w-full flex items-center justify-center gap-2">
              {resending && <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />}
              Resend verification email
            </button>
            <Link to="/login" className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-display font-bold text-3xl mb-4 shadow-lg glow-indigo">F</div>
          <h1 className="font-display text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-2 text-sm">Start tracking your finances today</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="John Doe" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="input" type="password" placeholder="Repeat password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}