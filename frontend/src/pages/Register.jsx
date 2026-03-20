import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

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
      toast.success('Account created! Welcome to FinTrack 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-display font-bold text-3xl mb-4 shadow-lg glow-indigo">
            F
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-2 text-sm">Start tracking your finances today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input 
                className="input" 
                placeholder="John Doe" 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input 
                className="input" 
                type="email" 
                placeholder="you@example.com" 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input 
                className="input" 
                type="password" 
                placeholder="Min. 6 characters" 
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input 
                className="input" 
                type="password" 
                placeholder="Repeat password" 
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} 
              />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton mode="register" />

          <p className="text-xs text-slate-500 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}