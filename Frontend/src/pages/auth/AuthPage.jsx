import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './Auth.css';

// ─────────────────────────────────────────────────────────
//  AuthPage – do tarah use hota hai:
//  1. Normal page  → <AuthPage />          (/login, /admin)
//  2. Modal popup  → <AuthPage isModal={true} onClose={fn} />
// ─────────────────────────────────────────────────────────
export default function AuthPage({ isModal = false, onClose }) {
  const { login, user, logout } = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();

  const [tab, setTab]   = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Normal page logic (sirf tab jab modal nahi hai) ──
  useEffect(() => {
    if (isModal) return;

    const isAdminRoute = location.pathname === '/admin';

    if (isAdminRoute && user?.role !== 'admin') {
      logout();
      return;
    }
    if (user?.role === 'admin' && isAdminRoute) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (user?.role === 'customer' && !isAdminRoute) {
      navigate('/', { replace: true });
      return;
    }
  }, [user, location.pathname, isModal]);

  // ── Modal: body scroll band karo ──
  useEffect(() => {
    if (!isModal) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isModal]);

  // ── Modal: ESC se band karo ──
  useEffect(() => {
    if (!isModal) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModal, onClose]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (tab === 'login') {
        const loggedUser = await login(form.email, form.password);

        if (!isModal) {
          // Normal page behaviour
          if (location.pathname === '/admin' && loggedUser.role !== 'admin') {
            logout();
            setError('Admin credentials required.');
            return;
          }
          if (loggedUser.role === 'admin') return navigate('/admin/dashboard');
          navigate('/');
        } else {
          // Modal behaviour – home pe hi raho
          if (loggedUser.role === 'admin') {
            onClose();
            navigate('/admin/dashboard');
          } else {
            onClose(); // bas modal band, home page same
          }
        }
      } else {
        await api.register({
          name:     form.name,
          email:    form.email,
          password: form.password,
          role:     'customer',
        });
        setSuccess('Account ban gaya! Ab login karo.');
        setTab('login');
        setForm({ name: '', email: form.email, password: '' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdminPage = !isModal && location.pathname === '/admin';

  // ── MODAL render ──
  if (isModal) {
    return (
      <div className="auth-modal-overlay" onClick={onClose}>
        <div className="auth-card" onClick={e => e.stopPropagation()}>

          {/* Close button */}
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="auth-logo">
            🛍️ <strong>E-Com</strong><span>merce</span>
          </div>

          <p className="auth-subtitle">
            {tab === 'login' ? 'Login to your account' : 'Create a new account'}
          </p>

          <div className="auth-tabs">
            <button
              className={tab === 'login' ? 'active' : ''}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >Login</button>
            <button
              className={tab === 'register' ? 'active' : ''}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >Register</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {tab === 'register' && (
              <div className="fg">
                <label>Full Name</label>
                <input type="text" name="name" value={form.name}
                  onChange={handle} placeholder="Your full name" required />
              </div>
            )}
            <div className="fg">
              <label>Email</label>
              <input type="email" name="email" value={form.email}
                onChange={handle} placeholder="you@email.com" required />
            </div>
            <div className="fg">
              <label>Password</label>
              <input type="password" name="password" value={form.password}
                onChange={handle} placeholder="Minimum 6 characters"
                required minLength={6} />
            </div>

            {error   && <div className="auth-error">⚠️ {error}</div>}
            {success && <div className="auth-success">✅ {success}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // ── NORMAL PAGE render (bilkul pehle jaisa) ──
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          🛍️ <strong>E-Com</strong><span>merce</span>
        </div>

        <p className="auth-subtitle">
          {isAdminPage
            ? '👑 Admin Login'
            : tab === 'login'
              ? 'Login to your account'
              : 'Create a new account'}
        </p>

        {!isAdminPage && (
          <div className="auth-tabs">
            <button
              className={tab === 'login' ? 'active' : ''}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >Login</button>
            <button
              className={tab === 'register' ? 'active' : ''}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >Register</button>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {tab === 'register' && !isAdminPage && (
            <div className="fg">
              <label>Full Name</label>
              <input type="text" name="name" value={form.name}
                onChange={handle} placeholder="Your full name" required />
            </div>
          )}
          <div className="fg">
            <label>Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handle} placeholder="you@email.com" required />
          </div>
          <div className="fg">
            <label>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handle} placeholder="Minimum 6 characters"
              required minLength={6} />
          </div>

          {error   && <div className="auth-error">⚠️ {error}</div>}
          {success && <div className="auth-success">✅ {success}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

      </div>
    </div>
  );
}
