import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Footer from '../../components/Footer/Footer';

import ProductModal from './modals/ProductModal';
import AdModal      from './modals/AdModal';
import BannerModal  from './modals/BannerModal';

import TabOverview   from './tabs/TabOverview';
import TabProducts   from './tabs/TabProducts';
import TabCategories from './tabs/TabCategories';
import TabOrders     from './tabs/TabOrders';
import TabCustomers  from './tabs/TabCustomers';
import TabMessages   from './tabs/TabMessages';
import TabAds        from './tabs/TabAds';
import TabBanners    from './tabs/TabBanners';

import './AdminDashboard.css';

// ── Shared Badge ──────────────────────────
export const Badge = ({ status }) => {
  const map = {
    pending:   'badge-warn',
    confirmed: 'badge-info',
    shipped:   'badge-info',
    delivered: 'badge-succ',
    cancelled: 'badge-err',
    active:    'badge-succ',
    inactive:  'badge-err',
    true:      'badge-succ',
    false:     'badge-err',
  };
  return (
    <span className={`adm-badge ${map[String(status)] || 'badge-info'}`}>
      {String(status)}
    </span>
  );
};

export const getImgUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `http://localhost:5000${img}`;
};

// ── Beep sound (Web Audio API, koi file nahi chahiye) ──
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

// ══════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');

  const [dashboard,   setDash]        = useState(null);
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [users,       setUsers]       = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [pageViews,   setPageViews]   = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ads,         setAds]         = useState([]);
  const [banners,     setBanners]     = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [msg,         setMsg]         = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ✅ New order notification state
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showOrderAlert, setShowOrderAlert] = useState(false);

  const [showModal,       setShowModal]       = useState(false);
  const [editProduct,     setEditProduct]     = useState(null);
  const [showAdModal,     setShowAdModal]     = useState(false);
  const [editAd,          setEditAd]          = useState(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editBanner,      setEditBanner]      = useState(null);

  const intervalRef  = useRef(null);
  const knownOrderIds = useRef(new Set()); // ✅ already dekhe hue order IDs

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin'); return; }
    loadAll();
    intervalRef.current = setInterval(() => silentRefresh(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, p, c, u, o, v, m, adsData, bannersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getSellerProducts(),
        api.getAdminCategories(),
        api.getUsers(),
        api.getAdminOrders(),
        api.getPageViews(),
        api.getContactMessages(),
        api.getAdminAds(),
        api.getAdminBanners(),
      ]);
      setDash(d);
      setProducts(p.products          || []);
      setCategories(c.categories      || []);
      setUsers(u.users                || []);

      const fetchedOrders = o.orders || [];
      setOrders(fetchedOrders);

      // ✅ Pehli baar load — sab IDs known maan lo (notification mat dikhao)
      fetchedOrders.forEach(order => knownOrderIds.current.add(order.id));

      setPageViews(v);
      setMessages(m.messages          || []);
      setUnreadCount(m.unread         || 0);
      setAds(adsData.ads              || []);
      setBanners(bannersData.banners  || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('loadAll error:', err);
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const [d, p, u, o, v, m, adsData, bannersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getSellerProducts(),
        api.getUsers(),
        api.getAdminOrders(),
        api.getPageViews(),
        api.getContactMessages(),
        api.getAdminAds(),
        api.getAdminBanners(),
      ]);
      setDash(d);
      setProducts(p.products          || []);
      setUsers(u.users                || []);

      const fetchedOrders = o.orders || [];

      // ✅ Naye orders detect karo
      const newOrders = fetchedOrders.filter(
        order => !knownOrderIds.current.has(order.id)
      );

      if (newOrders.length > 0) {
        // Sab naye IDs known mein add karo
        newOrders.forEach(order => knownOrderIds.current.add(order.id));

        // Notification dikhao + beep bajao
        setNewOrderCount(prev => prev + newOrders.length);
        setShowOrderAlert(true);
        playBeep();

        // Browser notification bhi (agar permission ho)
        if (Notification.permission === 'granted') {
          new Notification('🛒 New Order!', {
            body: `${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} received!`,
            icon: '/favicon.ico',
          });
        }

        // 8 second baad alert hide karo
        setTimeout(() => setShowOrderAlert(false), 8000);
      }

      setOrders(fetchedOrders);
      setPageViews(v);
      setMessages(m.messages          || []);
      setUnreadCount(m.unread         || 0);
      setAds(adsData.ads              || []);
      setBanners(bannersData.banners  || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  // ✅ Browser notification permission maango
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await silentRefresh();
    setRefreshing(false);
    flash('Dashboard refreshed!');
  };

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(''), 3000);
  };

  // ✅ Orders tab pe click karne par notification clear karo
  const handleTabChange = (tabId) => {
    setTab(tabId);
    if (tabId === 'orders') {
      setNewOrderCount(0);
      setShowOrderAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="adm-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview',   icon: '📊', label: 'Overview'      },
    { id: 'products',   icon: '📦', label: 'Products'      },
    { id: 'categories', icon: '🗂️', label: 'Categories'   },
    { id: 'orders',     icon: '🛒', label: 'Orders'        },
    { id: 'customers',  icon: '👥', label: 'Customers'     },
    { id: 'messages',   icon: '💬', label: 'Inquery Page'  },
    { id: 'ads',        icon: '📢', label: 'Ads'           },
    { id: 'banners',    icon: '🖼️', label: 'Hero Banners' },
  ];

  return (
    <>
      <div className="adm-layout">

        {/* ══ SIDEBAR ══ */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-brand">
            <span className="adm-brand-icon">🛍️</span>
            <div>
              <strong>E-Commerce</strong>
              <small>Admin Panel</small>
            </div>
          </div>
          <nav className="adm-nav">
            {navItems.map(item => (
              <button key={item.id}
                className={`adm-nav-btn ${tab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}>
                <span className="adm-nav-icon">{item.icon}</span>
                <span>{item.label}</span>

                {/* ✅ Orders badge – naye orders count */}
                {item.id === 'orders' && newOrderCount > 0 && (
                  <span className="adm-nav-unread">{newOrderCount}</span>
                )}

                {/* Messages badge */}
                {item.id === 'messages' && unreadCount > 0 && (
                  <span className="adm-nav-unread">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="adm-sidebar-user">
            <div className="adm-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="adm-user-info">
              <p>{user?.name}</p>
              <small>Administrator</small>
            </div>
            <button className="adm-logout-btn" onClick={() => { logout(); navigate('/admin'); }}>
              ⏻ Logout
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main className="adm-main">

          {/* Topbar */}
          <div className="adm-topbar">
            <div className="adm-topbar-left">
              <h1>
                {tab === 'overview'   && 'Dashboard Overview'}
                {tab === 'products'   && 'Products Management'}
                {tab === 'categories' && 'Categories Management'}
                {tab === 'orders'     && 'All Orders'}
                {tab === 'customers'  && 'Customers'}
                {tab === 'messages'   && 'Customer Inquery Page'}
                {tab === 'ads'        && 'Ads Management'}
                {tab === 'banners'    && 'Hero Banners'}
              </h1>
              <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', display: 'block' }}>
                Last updated: {lastRefresh.toLocaleTimeString('en-IN')} · Auto-refreshes every 30s
              </small>
            </div>
            <div className="adm-topbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleManualRefresh} disabled={refreshing} className="adm-btn-refresh">
                {refreshing ? '⏳' : '🔄'} Refresh
              </button>
              {tab === 'products' && (
                <button className="adm-btn-primary"
                  onClick={() => { setEditProduct(null); setShowModal(true); }}>
                  + Add Product
                </button>
              )}
            </div>
          </div>

          {/* ✅ New Order Alert Banner */}
          {showOrderAlert && (
            <div className="adm-new-order-alert" onClick={() => handleTabChange('orders')}>
              <span className="adm-new-order-alert__icon">🛒</span>
              <div className="adm-new-order-alert__text">
                <strong>{newOrderCount} New Order{newOrderCount > 1 ? 's' : ''} Received!</strong>
                <span>Click here to view orders</span>
              </div>
              <button
                className="adm-new-order-alert__close"
                onClick={e => { e.stopPropagation(); setShowOrderAlert(false); }}
              >✕</button>
            </div>
          )}

          {/* Flash */}
          {msg && (
            <div className={`adm-flash ${msg.isError ? 'adm-flash-err' : 'adm-flash-ok'}`}>
              {msg.isError ? '⚠️' : '✅'} {msg.text}
            </div>
          )}

          {/* ══ TABS ══ */}
          {tab === 'overview' && (
            <TabOverview
              dashboard={dashboard}
              orders={orders}
              pageViews={pageViews}
              messages={messages}
              unreadCount={unreadCount}
              onViewMessages={() => setTab('messages')}
            />
          )}
          {tab === 'products' && (
            <TabProducts
              products={products}
              setProducts={setProducts}
              onEdit={(p) => { setEditProduct(p); setShowModal(true); }}
              flash={flash}
            />
          )}
          {tab === 'categories' && (
            <TabCategories
              categories={categories}
              setCategories={setCategories}
              flash={flash}
            />
          )}
          {tab === 'orders' && (
            <TabOrders
              orders={orders}
              setOrders={setOrders}
              flash={flash}
            />
          )}
          {tab === 'customers' && (
            <TabCustomers
              users={users}
              setUsers={setUsers}
              flash={flash}
            />
          )}
          {tab === 'messages' && (
            <TabMessages
              messages={messages}
              setMessages={setMessages}
              unreadCount={unreadCount}
              setUnreadCount={setUnreadCount}
              flash={flash}
            />
          )}
          {tab === 'ads' && (
            <TabAds
              ads={ads}
              setAds={setAds}
              flash={flash}
              showAdModal={showAdModal}
              setShowAdModal={setShowAdModal}
              editAd={editAd}
              setEditAd={setEditAd}
            />
          )}
          {tab === 'banners' && (
            <TabBanners
              banners={banners}
              setBanners={setBanners}
              flash={flash}
              showBannerModal={showBannerModal}
              setShowBannerModal={setShowBannerModal}
              editBanner={editBanner}
              setEditBanner={setEditBanner}
            />
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          adminId={user?.id}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={() => {
            setShowModal(false); setEditProduct(null);
            loadAll();
            flash('Product saved successfully!');
          }}
        />
      )}

      <Footer />
    </>
  );
}
