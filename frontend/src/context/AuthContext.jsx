import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('user')) || null; 
    } catch { 
      return null; 
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (!token) { 
        setLoading(false); 
        return; 
      }
      try {
        const { data } = await authAPI.getProfile();
        setUser(data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  // Regular login with email/password
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ 
      _id: data._id, 
      name: data.name, 
      email: data.email,
      avatar: data.avatar || null
    }));
    setUser({ 
      _id: data._id, 
      name: data.name, 
      email: data.email,
      avatar: data.avatar || null
    });
    return data;
  }, []);

  // Google login (receives user data from popup)
  const googleLogin = useCallback(async (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || null
    }));
    setUser({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || null
    });
    return userData;
  }, []);

  // Register with email/password (auto-verified)
  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    // Auto-login after registration
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ 
      _id: data._id, 
      name: data.name, 
      email: data.email 
    }));
    setUser({ 
      _id: data._id, 
      name: data.name, 
      email: data.email 
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};