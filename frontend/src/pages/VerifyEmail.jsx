import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  // Handle success redirect with token in query params
  useEffect(() => {
    const jwtToken = searchParams.get('token');
    const name     = searchParams.get('name');
    const email    = searchParams.get('email');
    const id       = searchParams.get('id');

    if (jwtToken && name && email) {
      // Store auth data and redirect
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify({ _id: id, name, email }));
      toast.success(`Welcome to FinTrack, ${name}! 🎉`);
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  // Handle token verification (when arriving from email link without redirect)
  useEffect(() => {
    if (!token || searchParams.get('token')) return;
    setStatus('loading');
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token, searchParams]);

  if (status === 'idle' || searchParams.get('token')) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="card p-10">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-white">Verifying your email...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-display text-xl font-semibold text-white mb-2">Email Verified!</h2>
              <p className="text-slate-400 text-sm mb-6">Your account is now active. Redirecting...</p>
              <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="font-display text-xl font-semibold text-white mb-2">Verification Failed</h2>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link to="/register" className="btn-primary inline-block">Register again</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}