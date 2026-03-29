import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Footer from '../../components/Footer/Footer';
import './AdminDashboard.css';

const Badge = ({ status }) => {
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

const getImgUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `http://localhost:5000${img}`;
};

function ProductModal({ product, categories, adminId, onClose, onSaved }) {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState(product?.images || []);
  const [imgMode, setImgMode] = useState('url');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [form, setForm] = useState({
    name:           product?.name              || '',
    description:    product?.description       || '',
    brand:          product?.brand             || '',
    price:          product?.price             || '',
    original_price: product?.original_price    || '',
    stock:          product?.stock             || '',
    category_id:    product?.category_id       || '',
    sizes:          product?.sizes?.join(',')  || '',
    colors:         product?.colors?.join(',') || '',
    tags:           product?.tags?.join(',')   || '',
    is_active:      product?.is_active !== false,
    image_urls:     product?.images?.join('\n') || '',
  });

// Disclaimer toggle state
const [hasDisclaimer, setHasDisclaimer] = useState(
  product?.has_disclaimer === 1 || false
);

const handle = (e) => {
  const { name, value, type, checked } = e.target;
  setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
};
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
const fd = new FormData();
fd.append('seller_id', adminId);
fd.append('has_disclaimer', hasDisclaimer ? '1' : '0');
Object.entries(form).forEach(([k, v]) => {
  if (k !== 'image_urls') fd.append(k, v);
});

      if (imgMode === 'file' && uploadedFiles.length > 0) {
        // Multiple files — har ek alag append karo
        uploadedFiles.forEach(f => fd.append('images', f));
      } else if (imgMode === 'url') {
        // URL mode — har URL alag append karo
        const urls = form.image_urls.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5);
        urls.forEach(u => fd.append('images', u));
      }

      isEdit ? await api.updateProduct(product.id, fd) : await api.createProduct(fd);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-pform" onSubmit={submit}>
          <div className="adm-pform-grid">
            <div className="apf apf-full">
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="e.g. Floral Maxi Dress" required />
            </div>
            <div className="apf">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handle} placeholder="e.g. StyleCo" />
            </div>
            <div className="apf">
              <label>Category *</label>
              <select name="category_id" value={form.category_id} onChange={handle} required>
                <option value="">-- Select --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="apf">
              <label>Selling Price (₹) *</label>
              <input name="price" type="number" min="1" value={form.price} onChange={handle} placeholder="799" required onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>MRP / Original Price (₹) *</label>
              <input name="original_price" type="number" min="1" value={form.original_price} onChange={handle} placeholder="1999" required onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>Add Stock <small>(will be added to existing)</small></label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handle} placeholder="e.g. 10 (adds to current)"
                onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>Sizes <small>(comma separated)</small></label>
              <input name="sizes" value={form.sizes} onChange={handle} placeholder="S, M, L, XL" />
            </div>
            <div className="apf">
              <label>Colors <small>(comma separated)</small></label>
              <input name="colors" value={form.colors} onChange={handle} placeholder="#FF0000, #00FF00" />
            </div>
            <div className="apf">
              <label>Tags <small>(comma separated)</small></label>
              <input name="tags" value={form.tags} onChange={handle} placeholder="Trending, New, Sale" />
            </div>
            <div className="apf apf-check">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} />
                Active (It will be visible on the store.)
              </label>
            </div>
            <div className="apf apf-full">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Product description..." />
            </div>

            {/* ── Return Policy Disclaimer Toggle ── */}
<div className="apf apf-full">

  {/* Checkbox toggle */}
  <label className="adm-disclaimer-toggle">
    <input
      type="checkbox"
      checked={hasDisclaimer}
      onChange={e => setHasDisclaimer(e.target.checked)}
    />
    <div className="adm-disclaimer-toggle__content">
      <span className="adm-disclaimer-toggle__title">
        ⚠️ Add <strong>Non-Returnable</strong> disclaimer to this product
      </span>
      <span className="adm-disclaimer-toggle__sub">
        Customers will see a return policy notice at checkout
      </span>
    </div>
    <span className={`adm-disclaimer-pill ${hasDisclaimer ? 'on' : 'off'}`}>
      {hasDisclaimer ? '✓ Added' : '+ Add'}
    </span>
  </label>

  {/* Preview — sirf tab dikhao jab checked ho */}
  {hasDisclaimer && (
    <div className="adm-disclaimer-box">
      <div className="adm-disclaimer-header">
        <span>⚠️</span>
        <strong>Return Policy Notice — Customers will see this at checkout</strong>
      </div>
      <ul className="adm-disclaimer-list">
        <li>🚫 This product is <strong>non-returnable</strong> once delivered.</li>
        <li>📦 Please check the product carefully before accepting delivery.</li>
        <li>❌ No refund or exchange will be provided after delivery.</li>
        <li>✅ Only damaged/wrong item complaints accepted within 24 hours.</li>
      </ul>
      <p className="adm-disclaimer-note">
        ℹ️ This disclaimer will be shown to customers at checkout.
      </p>
    </div>
  )}
</div>
            <div className="apf apf-full">
              <label>Product Images <small>(max 5)</small></label>
              <div className="adm-img-mode-tabs">
                <button type="button" className={imgMode === 'url' ? 'active' : ''}
                  onClick={() => { setImgMode('url'); setUploadedFiles([]); setPreviews(form.image_urls.split('\n').map(u => u.trim()).filter(Boolean)); }}>
                  🔗 Image URL
                </button>
                <button type="button" className={imgMode === 'file' ? 'active' : ''}
                  onClick={() => { setImgMode('file'); setPreviews([]); }}>
                  📷 Upload Photos
                </button>
              </div>
              {imgMode === 'url' && (
                <textarea name="image_urls" value={form.image_urls}
                  onChange={(e) => { handle(e); setPreviews(e.target.value.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5)); }}
                  rows={4} placeholder={"Every line should have an image URL (max 5):\nhttps://example.com/image1.jpg"} />
              )}
              {imgMode === 'file' && (
                <div className="adm-upload-zone">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    id="img-file-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 5);
                      setUploadedFiles(files);
                      setPreviews(files.map(f => URL.createObjectURL(f)));
                    }}
                  />
                  <label htmlFor="img-file-upload" className="adm-upload-zone__label">
                    <span className="adm-upload-zone__icon">📷</span>
                    <p>Click here to choose photos</p>
                    <small>JPG, PNG, WEBP • Max 5MB each • Max 5 photos • Hold Ctrl to select multiple</small>
                  </label>
                </div>
              )}
              {previews.length > 0 && (
                <div className="adm-img-previews">
                  {previews.slice(0, 5).map((src, i) => (
                    <div key={i} className="adm-img-preview">
                      <img src={src} alt="" onError={e => e.target.style.display = 'none'} />
                      <button type="button" className="adm-img-remove"
                        onClick={() => {
                          if (imgMode === 'url') {
                            const lines = form.image_urls.split('\n').filter((_, idx) => idx !== i).join('\n');
                            setForm(f => ({ ...f, image_urls: lines }));
                          }
                          setPreviews(p => p.filter((_, idx) => idx !== i));
                          setUploadedFiles(f => f.filter((_, idx) => idx !== i));
                        }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <div className="adm-form-error">⚠️ {error}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn-save" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '✅ Update Product' : '✅ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab,          setTab]          = useState('overview');
  const [dashboard,    setDash]         = useState(null);
  const [products,     setProducts]     = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [users,        setUsers]        = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [pageViews,    setPageViews]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editProduct,  setEditProduct]  = useState(null);
  const [msg,          setMsg]          = useState('');
  const [search,       setSearch]       = useState('');
  const [stockLoading, setStockLoading] = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
const [expandedOrder, setExpandedOrder] = useState(null);
const [messages,      setMessages]      = useState([]);
const [unreadCount,   setUnreadCount]   = useState(0);
const [replyText,     setReplyText]     = useState({});
const [replyingTo,    setReplyingTo]    = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin'); return; }
    loadAll();

    // Auto refresh har 30 seconds
    intervalRef.current = setInterval(() => {
      silentRefresh();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

const loadAll = async () => {
  setLoading(true);
  try {
    const [d, p, c, u, o, v, m] = await Promise.all([
      api.getAdminDashboard(),
      api.getSellerProducts(),
      api.getAdminCategories(),
      api.getUsers(),
      api.getAdminOrders(),
      api.getPageViews(),
      api.getContactMessages(),
    ]);
    setDash(d);
    setProducts(p.products     || []);
    setCategories(c.categories || []);
    setUsers(u.users           || []);
    setOrders(o.orders         || []);
    setPageViews(v);
    setMessages(m.messages     || []);
    setUnreadCount(m.unread    || 0);
    setLastRefresh(new Date());
      } catch (err) {
      console.error('loadAll error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — spinner nahi dikhata
const silentRefresh = async () => {
  try {
    const [d, p, u, o, v, m] = await Promise.all([
      api.getAdminDashboard(),
      api.getSellerProducts(),
      api.getUsers(),
      api.getAdminOrders(),
      api.getPageViews(),
      api.getContactMessages(),
    ]);
    setDash(d);
    setProducts(p.products  || []);
    setUsers(u.users        || []);
    setOrders(o.orders      || []);
    setPageViews(v);
    setMessages(m.messages  || []);
    setUnreadCount(m.unread || 0);
    setLastRefresh(new Date());
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  // Manual refresh button
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(ps => ps.filter(p => p.id !== id));
      flash('Product deleted successfully');
    } catch (err) { flash(err.message, true); }
  };

  const handleToggleStock = async (productId) => {
    setStockLoading(productId);
    try {
      const data = await api.toggleStock(productId);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: data.stock } : p));
      flash(data.message);
    } catch (err) { flash(err.message, true); }
    finally { setStockLoading(null); }
  };

  const handleToggleCategory = async (cat) => {
    try {
      await api.toggleCategory(cat.id);
      setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, is_active: c.is_active ? 0 : 1 } : c));
      flash(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) { flash(err.message, true); }
  };

  const toggleUser = async (id) => {
    try {
      await api.toggleUserActive(id);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      flash('User status updated');
    } catch (err) { flash(err.message, true); }
  };

  const updateOrder = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      flash('Order status updated');
    } catch (err) { flash(err.message, true); }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="adm-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const t = dashboard?.totals || {};

const navItems = [
  { id: 'overview',   icon: '📊', label: 'Overview'   },
  { id: 'products',   icon: '📦', label: 'Products'   },
  { id: 'categories', icon: '🗂️', label: 'Categories' },
  { id: 'orders',     icon: '🛒', label: 'Orders'     },
  { id: 'customers',  icon: '👥', label: 'Customers'  },
  { id: 'messages',   icon: '💬', label: 'Messages'   },
];
  return (
    <>
      <div className="adm-layout">
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
    onClick={() => setTab(item.id)}>
    <span className="adm-nav-icon">{item.icon}</span>
    <span>{item.label}</span>
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

        <main className="adm-main">
          <div className="adm-topbar">
            <div className="adm-topbar-left">
              <h1>
                {tab === 'overview'   && 'Dashboard Overview'}
                {tab === 'products'   && 'Products Management'}
                {tab === 'categories' && 'Categories Management'}
                {tab === 'orders'     && 'All Orders'}
{tab === 'customers'  && 'Customers'}
{tab === 'messages'   && 'Contact Messages'}
              </h1>
              <small style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Last updated: {lastRefresh.toLocaleTimeString('en-IN')} · Auto-refreshes every 30s
              </small>
            </div>
            <div className="adm-topbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="adm-btn-refresh"
              >
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

          {msg && (
            <div className={`adm-flash ${msg.isError ? 'adm-flash-err' : 'adm-flash-ok'}`}>
              {msg.isError ? '⚠️' : '✅'} {msg.text}
            </div>
          )}

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="adm-content">
              <div className="adm-stats-grid">
                {[
                  { label: 'Total Revenue',    value: `₹${Number(t.total_revenue||0).toLocaleString()}`, icon: '💰', color: '#FF3E6C' },
                  { label: 'Total Orders',     value: t.total_orders    || 0, icon: '📦', color: '#6C63FF' },
                  { label: 'Products',         value: t.total_products  || 0, icon: '🏷️', color: '#14C38E' },
                  { label: 'Customers',        value: t.total_customers || 0, icon: '👥', color: '#FFB400' },
                  { label: 'Pending Orders',   value: t.pending_orders  || 0, icon: '⏳', color: '#FF7043' },
                  { label: 'Total Page Visits',value: pageViews?.total  || 0, icon: '👁️', color: '#6C63FF' },
                  { label: "Today's Visits",   value: pageViews?.today  || 0, icon: '📅', color: '#14C38E' },
                ].map(s => (
                  <div key={s.label} className="adm-stat-card" style={{ '--clr': s.color }}>
                    <div className="adm-stat-icon">{s.icon}</div>
                    <div className="adm-stat-body">
                      <div className="adm-stat-value">{s.value}</div>
                      <div className="adm-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {pageViews?.topPages?.length > 0 && (
                <div className="adm-card">
                  <h3>📊 Most Visited Pages</h3>
                  <table className="adm-table">
                    <thead><tr><th>#</th><th>Page</th><th>Views</th></tr></thead>
                    <tbody>
                      {pageViews.topPages.map((p, i) => (
                        <tr key={i}>
                          <td><strong>{i + 1}</strong></td>
                          <td>{p.page}</td>
                          <td><span className="adm-views-badge">{p.views}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(() => {
                const months = [];
                for (let i = 5; i >= 0; i--) {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                  const label = d.toLocaleString('en-IN', { month: 'short' });
                  const found = dashboard?.monthly?.find(m => m.month === key);
                  months.push({ key, label, revenue: Number(found?.revenue || 0), orders: found?.orders || 0 });
                }
                const max = Math.max(...months.map(m => m.revenue), 1);
                return (
                  <div className="adm-card">
                    <h3>Monthly Revenue (Last 6 Months)</h3>
                    <div className="adm-bar-chart">
                      {months.map(m => {
                        const pct = (m.revenue / max) * 100;
                        return (
                          <div key={m.key} className="adm-bar-col">
                            <div className="adm-bar-tip">
                              ₹{m.revenue.toLocaleString()}<br/>
                              <small>{m.orders} orders</small>
                            </div>
                            <div className="adm-bar" style={{ height: `${Math.max(pct, m.revenue > 0 ? 4 : 0)}%` }}/>
                            <span>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {orders.length > 0 && (
                <div className="adm-card">
                  <h3>Recent Orders</h3>
                  <table className="adm-table">
                    <thead>
                      <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td><strong>#{o.id}</strong></td>
                          <td>{o.customer_name}</td>
                          <td><strong>₹{Number(o.total_amount).toLocaleString()}</strong></td>
                          <td><Badge status={o.status} /></td>
                          <td><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS */}
          {tab === 'products' && (
            <div className="adm-content">
              <div className="adm-search-bar">
                <input type="text" placeholder="🔍 Search products..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                <span>{filteredProducts.length} products</span>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="adm-empty">
                  <span>📦</span><p>No products found</p>
                  <button className="adm-btn-primary"
                    onClick={() => { setEditProduct(null); setShowModal(true); }}>
                    + Add First Product
                  </button>
                </div>
              ) : (
                <div className="adm-card">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Image</th><th>Product</th><th>Category</th>
                        <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img src={getImgUrl(p.images?.[0]) || ''} alt={p.name}
                              className="adm-product-thumb"
                              onError={e => e.target.style.display='none'} />
                          </td>
                          <td><strong>{p.name}</strong><small>{p.brand}</small></td>
                          <td>{p.category_name}</td>
                          <td>
                            <strong>₹{Number(p.price).toLocaleString()}</strong>
                            <small>MRP ₹{Number(p.original_price).toLocaleString()}</small>
                          </td>
                          <td>
                            <span className={p.stock > 0 ? 'adm-stock-ok' : 'adm-stock-out'}>
                              {p.stock > 0 ? `${p.stock} left` : 'Out of Stock'}
                            </span>
                          </td>
                          <td><Badge status={p.is_active ? 'active' : 'inactive'} /></td>
                          <td>
                            <div className="adm-actions">
                              <button
                                className={p.stock > 0 ? 'adm-btn-stock-out' : 'adm-btn-stock-in'}
                                onClick={() => handleToggleStock(p.id)}
                                disabled={stockLoading === p.id}>
                                {stockLoading === p.id ? '...' : p.stock > 0 ? '📦 Out of Stock' : '✅ In Stock'}
                              </button>
                              <button className="adm-btn-edit"
                                onClick={() => { setEditProduct(p); setShowModal(true); }}>
                                ✏️ Edit
                              </button>
                              <button className="adm-btn-delete" onClick={() => handleDelete(p.id)}>
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === 'categories' && (
            <div className="adm-content">
              <div className="adm-cat-info">
                💡 Active categories are visible on the user's home page — toggle to show/hide them
              </div>
              <div className="adm-cat-grid">
                {categories.map(c => (
                  <div key={c.id} className={`adm-cat-card ${c.is_active ? 'cat-active' : 'cat-inactive'}`}>
                    <button className={`adm-cat-toggle-btn ${c.is_active ? 'on' : 'off'}`}
                      onClick={() => handleToggleCategory(c)}>
                      {c.is_active ? '✓' : '✕'}
                    </button>
                    <span className="adm-cat-emoji">{c.emoji}</span>
                    <strong>{c.name}</strong>
                    <small>/{c.slug}</small>
                    <span className={`adm-cat-status ${c.is_active ? 'on' : 'off'}`}>
                      {c.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {tab === 'orders' && (
            <div className="adm-content">
              {orders.length === 0 ? (
                <div className="adm-empty"><span>🛒</span><p>No orders right now.</p></div>
              ) : (
                <div className="adm-card">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Order ID</th><th>Customer</th><th>Items</th>
                        <th>Total</th><th>Payment</th><th>Status</th>
                        <th>Date</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <React.Fragment key={o.id}>
                        <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                          <td><strong>#{o.id}</strong></td>
                          <td>
                            <strong>{o.customer_name}</strong>
                            <small>{o.customer_email}</small>
                            <small>📞 {o.customer_phone}</small>
                          </td>
                          <td>
                            <div className="adm-order-items-preview">
                              {o.items && o.items.length > 0 ? (
                                <>
                                  {o.items.slice(0, 2).map((item, i) => {
                                    const imgUrl = getImgUrl(item.image);
                                    return (
                                      <div key={i} className="adm-order-item-preview">
                                        {imgUrl ? (
                                          <img src={imgUrl} alt={item.product_name}
                                            onError={e => e.target.style.display='none'} />
                                        ) : (
                                          <div className="adm-order-item-fallback">🛍️</div>
                                        )}
                                        <span>{item.product_name}</span>
                                      </div>
                                    );
                                  })}
                                  {o.items.length > 2 && (
                                    <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                      +{o.items.length - 2} more
                                    </small>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                  {o.item_count} item{o.item_count !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><strong>₹{Number(o.total_amount).toLocaleString()}</strong></td>
                          <td><span className="adm-badge badge-info">{o.payment_method}</span></td>
                          <td><Badge status={o.status} /></td>
                          <td><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                          <td onClick={e => e.stopPropagation()}>
                            {!['delivered','cancelled'].includes(o.status) && (
                              <select className="adm-select" value={o.status}
                                onChange={e => updateOrder(o.id, e.target.value)}>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                          </td>
                        </tr>

                        {/* ── Expanded Order Details ── */}
                        {expandedOrder === o.id && (
                          <tr className="adm-order-detail-row">
                            <td colSpan={8}>
                              <div className="adm-order-detail">

                                {/* Delivery Info */}
                                <div className="adm-order-detail__section">
                                  <h4>📍 Delivery Details</h4>
                                  <div className="adm-order-detail__grid">
                                    <div><span>Customer Name</span><strong>{o.customer_name}</strong></div>
                                    <div><span>Phone</span><strong>{o.customer_phone}</strong></div>
                                    <div><span>Email</span><strong>{o.customer_email}</strong></div>
                                    <div className="adm-full"><span>Delivery Address</span><strong>{o.address}</strong></div>
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div className="adm-order-detail__section">
                                  <h4>🛒 Ordered Items</h4>
                                  {o.items?.map((item, i) => (
                                    <div key={i} className="adm-order-detail__item">
                                      {getImgUrl(item.image) && (
                                        <img src={getImgUrl(item.image)} alt={item.product_name}
                                          onError={e => e.target.style.display='none'} />
                                      )}
                                      <div>
                                        <strong>{item.product_name}</strong>
                                        <small>
                                          {item.size && `Size: ${item.size}`}
                                          {item.color && ` | Color: ${item.color}`}
                                          {` | Qty: ${item.quantity}`}
                                        </small>
                                      </div>
                                      <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                                    </div>
                                  ))}
                                </div>

                                {/* Payment Info */}
                                <div className="adm-order-detail__section">
                                  <h4>💳 Payment Info</h4>
                                  <div className="adm-order-detail__grid">
                                    <div><span>Method</span><strong>{o.payment_method}</strong></div>
                                    <div><span>Status</span><strong style={{color: o.payment_status === 'paid' ? '#0A7D56' : '#B37A00'}}>{o.payment_status}</strong></div>
                                    <div><span>Total Amount</span><strong>₹{Number(o.total_amount).toLocaleString()}</strong></div>
                                    <div><span>Order Date</span><strong>{new Date(o.created_at).toLocaleString('en-IN')}</strong></div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CUSTOMERS */}
          {tab === 'customers' && (
            <div className="adm-content">
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Email</th>
                      <th>Role</th><th>Joined</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'customer').map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><Badge status={u.role} /></td>
                        <td><small>{new Date(u.created_at).toLocaleDateString('en-IN')}</small></td>
                        <td><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                        <td>
                          <button
                            className={u.is_active ? 'adm-btn-delete' : 'adm-btn-edit'}
                            onClick={() => toggleUser(u.id)}>
                            {u.is_active ? '🚫 Ban' : '✅ Unban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role === 'customer').length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
                          No customers yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}




{/* ── MESSAGES ── */}
{tab === 'messages' && (
  <div className="adm-content">
    <div className="adm-search-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
          💬 Contact Messages
        </h3>
        {unreadCount > 0 && (
          <span className="adm-unread-badge">{unreadCount} unread</span>
        )}
      </div>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {messages.length} total
      </span>
    </div>

    {messages.length === 0 ? (
      <div className="adm-empty">
        <span>💬</span>
        <p>No messages yet.</p>
      </div>
    ) : (
      <div className="adm-messages-list">
        {messages.map(m => (
          <div key={m.id}
            className={`adm-msg-card ${m.status === 'unread' ? 'unread' : ''}`}>

            <div className="adm-msg-header">
              <div className="adm-msg-sender">
                <div className="adm-msg-avatar">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{m.name}</strong>
                  <span>{m.email}</span>
                  {m.phone && <span>📞 {m.phone}</span>}
                </div>
              </div>
              <div className="adm-msg-meta">
                {m.subject && (
                  <span className="adm-msg-subject">{m.subject}</span>
                )}
                <span className={`adm-msg-status ${m.status}`}>
                  {m.status === 'unread'  ? '🔵 Unread'  :
                   m.status === 'replied' ? '✅ Replied' : '👁️ Read'}
                </span>
                <small>{new Date(m.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}</small>
              </div>
            </div>

            <div className="adm-msg-body">
              <p>{m.message}</p>
            </div>

            {m.reply && (
              <div className="adm-msg-reply-sent">
                <strong>✅ Your Reply:</strong>
                <p>{m.reply}</p>
              </div>
            )}

            <div className="adm-msg-actions">
              {m.status === 'unread' && (
                <button className="adm-btn-edit"
                  onClick={async () => {
                    await api.markMessageRead(m.id);
                    setMessages(ms => ms.map(x =>
                      x.id === m.id ? { ...x, status: 'read' } : x
                    ));
                    setUnreadCount(c => Math.max(0, c - 1));
                  }}>
                  👁️ Mark Read
                </button>
              )}
              <button className="adm-btn-save"
                style={{ fontSize: '12px', padding: '5px 14px' }}
                onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}>
                {replyingTo === m.id ? '✕ Close' : '↩️ Reply'}
              </button>
              <button className="adm-btn-delete"
                onClick={async () => {
                  if (!window.confirm('Delete this message?')) return;
                  await api.deleteContactMessage(m.id);
                  setMessages(ms => ms.filter(x => x.id !== m.id));
                  if (m.status === 'unread') setUnreadCount(c => Math.max(0, c - 1));
                  flash('Message deleted');
                }}>
                🗑️ Delete
              </button>
            </div>

            {replyingTo === m.id && (
              <div className="adm-msg-reply-form">
                <textarea
                  placeholder={`Reply to ${m.name}...`}
                  value={replyText[m.id] || ''}
                  onChange={e => setReplyText(r => ({ ...r, [m.id]: e.target.value }))}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="adm-btn-save"
                    onClick={async () => {
                      const reply = replyText[m.id];
                      if (!reply?.trim()) return;
                      await api.replyToMessage(m.id, { reply });
                      setMessages(ms => ms.map(x =>
                        x.id === m.id ? { ...x, reply, status: 'replied' } : x
                      ));
                      setReplyText(r => ({ ...r, [m.id]: '' }));
                      setReplyingTo(null);
                      flash('Reply saved!');
                    }}>
                    ✅ Save Reply
                  </button>
                  <button className="adm-btn-cancel"
                    onClick={() => setReplyingTo(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
        </main>



        {showModal && (
          <ProductModal
            product={editProduct}
            categories={categories}
            adminId={user?.id}
            onClose={() => { setShowModal(false); setEditProduct(null); }}
            onSaved={() => {
              setShowModal(false);
              setEditProduct(null);
              loadAll();
              flash('Product saved successfully!');
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
