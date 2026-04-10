import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider }   from './context/AuthContext';
import { CartProvider }   from './context/CartContext';
import { useAuth }        from './context/AuthContext';
import ProtectedRoute     from './components/auth/ProtectedRoute';

import Navbar           from './components/Navbar/Navbar';
import Footer           from './components/Footer/Footer';
import Home             from './pages/Home';
import ProductDetail    from './pages/ProductDetail';
import Checkout         from './pages/checkout/Checkout';
import CartPage         from './components/Cart/Cart';
import Wishlist         from './pages/Wishlist';
import AuthPage         from './pages/auth/AuthPage';
import UserAccount      from './pages/user/UserAccount';
import AdminDashboard   from './pages/admin/AdminDashboard';

import TawkMessenger from './components/TawkMessenger/TawkMessenger';

import AboutPage    from './pages/info/AboutPage';
import ContactPage  from './pages/info/ContactPage';
import ShippingPage from './pages/info/ShippingPage';
import ReturnsPage  from './pages/info/ReturnsPage';
import FAQPage      from './pages/info/FAQPage';

import './index.css';

// ── Admin Chat ──
function AdminChat() {
  return (
    <div style={{ width: '100%', height: '85vh', padding: '10px' }}>
      <iframe
        src="https://dashboard.tawk.to/"
        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
        title="Tawk Admin"
      />
    </div>
  );
}

// ── Page View Tracker ──
function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      fetch('http://localhost:5000/api/track/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: location.pathname }),
      }).catch(() => {});
    }
  }, [location.pathname]);
  return null;
}

// ── Top Header ──
function TopHeader() {
  return <div className="top-header">🛍️ Steepray E-Commerce System</div>;
}

// ── User pages wrapper ──
function WithNavFooter({ children }) {
  return (
    <>
      <TopHeader />
      <Navbar />
      <main style={{
        minHeight: 'calc(100vh - var(--navbar-height) - 200px)',
        marginTop: 'var(--top-header-height)'
      }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

// ── Home wrapper ──
function HomeWrapper() {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <>
      <TopHeader />
      <Navbar onSearch={setSearchQuery} />
      <main style={{
        minHeight: 'calc(100vh - var(--navbar-height) - 200px)',
        marginTop: 'var(--top-header-height)'
      }}>
        <Home searchQuery={searchQuery} />
      </main>
      <Footer />
    </>
  );
}

// ── Admin wrapper ──
function AdminWrapper({ children }) {
  return (
    <>
      <div className="admin-header">
        <span className="admin-header__logo">🛍️ Steepray E-Commerce System</span>
      </div>
      {children ? children : <AdminDashboard />}
    </>
  );
}

// ── AppRoutes ──
function AppRoutes() {
  const location    = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // ✅ AuthContext se modal state lo
  const { showLoginModal, closeLoginModal } = useAuth();

  return (
    <>
      <PageTracker />
      {!isAdminPath && <TawkMessenger />}

      <Routes>
        {/* ── Home ── */}
        <Route path="/"            element={<HomeWrapper />} />
        <Route path="/home"        element={<HomeWrapper />} />
        <Route path="/product/:id" element={<WithNavFooter><ProductDetail /></WithNavFooter>} />

        {/* ── Auth (sirf /admin ke liye page, login ab modal se hoga) ── */}
        <Route path="/login"    element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/admin"    element={<AuthPage />} />

        {/* ── Protected ── */}
        <Route path="/cart" element={
          <ProtectedRoute roles={['customer', 'admin']}>
            <WithNavFooter><CartPage /></WithNavFooter>
          </ProtectedRoute>
        } />
        <Route path="/wishlist" element={
          <ProtectedRoute roles={['customer', 'admin']}>
            <WithNavFooter><Wishlist /></WithNavFooter>
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute roles={['customer', 'admin']}>
            <WithNavFooter><Checkout /></WithNavFooter>
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute roles={['customer', 'admin']}>
            <WithNavFooter><UserAccount /></WithNavFooter>
          </ProtectedRoute>
        } />

        {/* ── Info Pages ── */}
        <Route path="/about"    element={<WithNavFooter><AboutPage /></WithNavFooter>} />
        <Route path="/contact"  element={<WithNavFooter><ContactPage /></WithNavFooter>} />
        <Route path="/shipping" element={<WithNavFooter><ShippingPage /></WithNavFooter>} />
        <Route path="/returns"  element={<WithNavFooter><ReturnsPage /></WithNavFooter>} />
        <Route path="/faq"      element={<WithNavFooter><FAQPage /></WithNavFooter>} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <AdminWrapper />
          </ProtectedRoute>
        } />
        <Route path="/admin/support" element={
          <ProtectedRoute roles={['admin']}>
            <AdminWrapper><AdminChat /></AdminWrapper>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ Login Modal – poori app ke upar, kahin se bhi trigger ho sake */}
      {showLoginModal && (
        <AuthPage isModal={true} onClose={closeLoginModal} />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
