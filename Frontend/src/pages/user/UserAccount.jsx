import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { generateInvoice } from '../../components/Invoice/Invoice';// --- TAWMESSENGER IMPORT ---
// Agar aapka folder structure: src/components/TawkMessenger/TawkMessenger.jsx hai
import TawkMessenger from '../../components/TawkMessenger/TawkMessenger';
import './UserAccount.css';

const statusConfig = {
  pending:   { label: 'Pending',   icon: '⏳', color: '#B37A00', bg: '#FFF6E0', border: '#FFE082', step: 1 },
  confirmed: { label: 'Confirmed', icon: '✅', color: '#4527A0', bg: '#EDE7F6', border: '#B39DDB', step: 2 },
  shipped:   { label: 'Shipped',   icon: '🚚', color: '#0277BD', bg: '#E1F5FE', border: '#81D4FA', step: 3 },
  delivered: { label: 'Delivered', icon: '📦', color: '#0A7D56', bg: '#E6FBF4', border: '#80CBC4', step: 4 },
  cancelled: { label: 'Cancelled', icon: '❌', color: '#C62828', bg: '#FFEBEE', border: '#EF9A9A', step: 0 },
};

const trackingSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: '✅', sub: 'Your order has been confirmed' },
  { key: 'shipped',   label: 'Shipped',          icon: '🚚', sub: 'Your order is on the way'     },
  { key: 'delivered', label: 'Delivered',         icon: '📦', sub: 'Order delivered successfully' },
];

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `http://localhost:5000${img}`;
};

const downloadInvoice = (order) => {
  generateInvoice(order);
};

function ReviewItem({ item }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { setMsg('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await api.addReview(item.product_id, { rating, comment });
      setSubmitted(true);
      setMsg('Review submitted successfully!');
    } catch (err) {
      setMsg(err.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="ua-review-box submitted">
        ✅ Review submitted for <strong>{item.product_name}</strong> — Thank you!
      </div>
    );
  }

  return (
    <div className="ua-review-box">
      <div className="ua-review-box__header" onClick={() => setOpen(!open)}>
        <span>⭐ Rate <strong>{item.product_name}</strong></span>
        <span className="ua-review-toggle">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="ua-review-box__body">
          <div className="ua-review-stars">
            {[1,2,3,4,5].map(n => (
              <span key={n}
                className={`ua-star ${n <= (hover || rating) ? 'filled' : ''}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}>
                ★
              </span>
            ))}
            <span className="ua-star-label">
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : ''}
            </span>
          </div>
          <textarea
            className="ua-review-comment"
            placeholder="Share your experience... (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
          />
          {msg && <p className="ua-review-msg">{msg}</p>}
          <button className="ua-review-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function UserAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [expanded, setExpanded] = useState(null);

  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getUserOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders(false);
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    if (passData.newPassword !== passData.confirmPassword) {
      return setPassMsg({ type: 'error', text: 'New password does not match!' });
    }
    setPassLoading(true);
    try {
      await api.updatePassword({
        currentPassword: passData.oldPassword,
        newPassword: passData.newPassword
      });
      setPassMsg({ type: 'success', text: 'Password updated successfully ✅' });
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  if (!user) return null;

  return (
    <div className="ua-page">
      {/* TAWMESSENGER COMPONENT ADDED HERE */}
      <TawkMessenger />

      <div className="ua-hero">
        <div className="ua-hero__inner container">
          <div className="ua-hero__avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="ua-hero__info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <div className="ua-hero__stats">
              <div className="ua-stat"><strong>{orders.length}</strong><span>Orders</span></div>
              <div className="ua-stat-divider" />
              <div className="ua-stat"><strong>{orders.filter(o => o.status === 'delivered').length}</strong><span>Delivered</span></div>
            </div>
          </div>
          <button className="ua-logout-btn" onClick={handleLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="container ua-body">
        <div className="ua-tabs">
          <button className={`ua-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            🛍️ My Orders
            {orders.length > 0 && <span className="ua-tab-badge">{orders.length}</span>}
          </button>
          <button className={`ua-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            👤 Profile & Settings
          </button>
          <button className="ua-refresh-btn" onClick={() => fetchOrders(false)} disabled={loading} title="Refresh">
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {tab === 'orders' && (
          <div className="ua-orders">
            {loading ? (
              <div className="ua-loading">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="ua-order-skeleton">
                    <div className="skeleton sk-header" />
                    <div className="skeleton sk-line" />
                    <div className="skeleton sk-line short" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="ua-empty">
                <div className="ua-empty__icon">🛍️</div>
                <h3>No orders yet!</h3>
                <p>Order your favourite items and track them here.</p>
                <Link to="/home" className="ua-shop-btn">Start Shopping →</Link>
              </div>
            ) : (
              <div className="ua-orders-list">
                {orders.map(order => {
                  const st = statusConfig[order.status] || statusConfig.pending;
                  const isOpen = expanded === order.id;
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <div key={order.id} className={`ua-order-card ${isOpen ? 'open' : ''}`}>
                      <div className="ua-order-card__head"
                        onClick={() => setExpanded(isOpen ? null : order.id)}>
                        <div className="ua-order-card__left">
                          <div className="ua-order-icon" style={{ background: st.bg, color: st.color }}>
                            {st.icon}
                          </div>
                          <div>
                            <div className="ua-order-id">Order #{order.id}</div>
                            <div className="ua-order-date">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="ua-order-card__right">
                          <span className="ua-status-badge"
                            style={{ color: st.color, background: st.bg, borderColor: st.border }}>
                            {st.label}
                          </span>
                          <div className="ua-order-amount">₹{Number(order.total_amount).toLocaleString()}</div>
                          <div className={`ua-chevron ${isOpen ? 'open' : ''}`}>▼</div>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="ua-order-card__body">
                          <div className="ua-order-items">
                            <h4>🛒 Order Items</h4>
                            {order.items?.map(item => {
                              const imgUrl = getImageUrl(item.image);
                              return (
                                <div key={item.id} className="ua-order-item">
                                  <div className="ua-order-item__img"
                                    onClick={() => navigate(`/product/${item.product_id}`)}
                                    style={{ cursor: 'pointer' }}>
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={item.product_name}
                                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                    ) : null}
                                    <div className="ua-img-fallback" style={{ display: imgUrl ? 'none' : 'flex' }}>🛍️</div>
                                  </div>
                                  <div className="ua-order-item__info">
                                    <strong onClick={() => navigate(`/product/${item.product_id}`)}
                                      style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                                      {item.product_name}
                                    </strong>
                                    <div className="ua-order-item__tags">
                                      {item.size   && <span>Size: {item.size}</span>}
                                      {item.color && <span>Color: {item.color}</span>}
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <strong className="ua-order-item__price">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>

                          {!isCancelled && (
                            <div className="ua-tracking">
                              <h4>📍 Order Tracking</h4>
                              <div className="ua-track-steps">
                                {trackingSteps.map((step, i) => {
                                  const done   = st.step > i + 1;
                                  const active = st.step === i + 2;
                                  return (
                                    <div key={step.key} className={`ua-track-step ${done ? 'done' : active ? 'active' : 'pending'}`}>
                                      <div className="ua-track-step__icon">
                                        {done ? '✓' : step.icon}
                                      </div>
                                      <div className="ua-track-step__info">
                                        <strong>{step.label}</strong>
                                        <span>{step.sub}</span>
                                      </div>
                                      {i < trackingSteps.length - 1 && (
                                        <div className={`ua-track-line ${done ? 'done' : ''}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {isCancelled && (
                            <div className="ua-cancelled-msg">❌ This order has been cancelled</div>
                          )}

                          {order.status === 'delivered' && order.items?.map(item => (
                            <ReviewItem key={item.id} item={item} />
                          ))}

                          <div className="ua-order-meta">
                            <div className="ua-order-address">
                              <span className="ua-meta-label">📍 Delivery Address</span>
                              <div className="ua-address-detail">
                                <p className="ua-address-name"><strong>{order.customer_name}</strong></p>
                                <p>{order.address}</p>
                                <p className="ua-address-phone">📞 {order.customer_phone || 'N/A'}</p>
                              </div>
                              {!isCancelled && order.payment_status === 'paid' && (
                                <button className="ua-invoice-btn" onClick={() => downloadInvoice(order)}>
                                  📄 Download Invoice
                                </button>
                              )}
                            </div>
                            <div className="ua-order-total-box">
                              <div className="ua-total-row">
                                <span>Payment Method</span>
                                <span>{order.payment_method}</span>
                              </div>
                              <div className="ua-total-row">
                                <span>Payment Status</span>
                                <span style={{ color: order.payment_status === 'paid' ? '#0A7D56' : '#B37A00', fontWeight: 600 }}>
                                  {order.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                                </span>
                              </div>
                              <div className="ua-total-row total">
                                <span>Total Paid</span>
                                <strong>₹{Number(order.total_amount).toLocaleString()}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="ua-profile">
            <div className="ua-profile-card">
              <div className="ua-profile-header">
                <div className="ua-profile-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{user.name}</h2>
                  <span className="ua-role-badge">{user.role}</span>
                </div>
              </div>
              <div className="ua-profile-rows">
                {[
                  { icon: '👤', label: 'Full Name',     value: user.name  },
                  { icon: '✉️', label: 'Email Address', value: user.email },
                  { icon: '🛡️', label: 'Account Type',  value: user.role  },
                ].map(row => (
                  <div key={row.label} className="ua-profile-row">
                    <span className="ua-profile-row__icon">{row.icon}</span>
                    <div>
                      <span>{row.label}</span>
                      <strong style={{ textTransform: 'capitalize' }}>{row.value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ua-quick-stats">
              {[
                { value: orders.length, label: 'Total Orders' },
                { value: orders.filter(o => o.status === 'delivered').length, label: 'Delivered' },
                { value: orders.filter(o => ['pending','confirmed','shipped'].includes(o.status)).length, label: 'In Progress' },
              ].map(s => (
                <div key={s.label} className="ua-qs-card">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="ua-password-section">
              <h3>🔒 Change Password</h3>
              <form onSubmit={handlePasswordUpdate} className="ua-pass-form">
                {passMsg.text && (
                  <div className={`ua-alert ${passMsg.type}`}>{passMsg.text}</div>
                )}
                <div className="ua-field">
                  <label>Current Password</label>
                  <input type="password" value={passData.oldPassword}
                    onChange={e => setPassData({...passData, oldPassword: e.target.value})} required />
                </div>
                <div className="ua-field">
                  <label>New Password</label>
                  <input type="password" value={passData.newPassword}
                    onChange={e => setPassData({...passData, newPassword: e.target.value})} required />
                </div>
                <div className="ua-field">
                  <label>Confirm New Password</label>
                  <input type="password" value={passData.confirmPassword}
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})} required />
                </div>
                <button type="submit" className="ua-update-btn" disabled={passLoading}>
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            <button className="ua-logout-full" onClick={handleLogout}>
              ⏻ &nbsp;Logout from Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}