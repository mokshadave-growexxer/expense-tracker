import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import VerifyEmail from './pages/VerifyEmail';
import Layout from './components/Layout';
import AIChatBot from './components/AIChatBot';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Toaster adapts to theme
function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color:      isDark ? '#f1f5f9' : '#0f172a',
          border:     isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: isDark ? '#1e293b' : '#ffffff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e293b' : '#ffffff' } },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ThemedToaster />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/verify-email/success" element={<VerifyEmail />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="expenses"  element={<Expenses />} />
              <Route path="income"    element={<Income />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <AIChatBot onTransactionAdded={() => {
            window.dispatchEvent(new CustomEvent('transaction-added'));
          }} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}