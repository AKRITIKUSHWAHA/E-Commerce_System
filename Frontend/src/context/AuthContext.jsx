import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const openLoginModal  = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  // Page reload par session restore karo
  useEffect(() => {
    const token = localStorage.getItem('sk_token');
    if (token) {
      api.getMe()
        .then(data => setUser(data.user))
        .catch(()  => localStorage.removeItem('sk_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('sk_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sk_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      setUser,
      // ✅ Modal controls
      showLoginModal,
      openLoginModal,
      closeLoginModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
