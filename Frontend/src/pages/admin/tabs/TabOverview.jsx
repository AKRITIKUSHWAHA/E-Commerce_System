import React from 'react';
import { Badge } from '../AdminDashboard';

export default function TabOverview({ dashboard, orders, pageViews, messages, unreadCount, onViewMessages, products }) {
  const t = dashboard?.totals || {};

  // Product ID se naam dhundo
  const getPageLabel = (page) => {
    const match = page.match(/^\/product\/(\d+)$/);
    if (match) {
      const productId = Number(match[1]);
      const product = products?.find(p => p.id === productId);
      return product
        ? `📦 ${product.name}`
        : `${page}`;
    }
    return page;
  };

  return (
    <div className="adm-content">

      {/* Stats */}
      <div className="adm-stats-grid">
        {[
          { label: 'Total Revenue',    value: `₹${Number(t.total_revenue||0).toLocaleString()}`, icon: '💰', color: '#FF3E6C' },
          { label: 'Total Orders',     value: t.total_orders    || 0, icon: '📦', color: '#6C63FF' },
          { label: 'Products',         value: t.total_products  || 0, icon: '🏷️', color: '#14C38E' },
          { label: 'Customers',        value: t.total_customers || 0, icon: '👥', color: '#FFB400' },
          { label: 'Pending Orders',   value: t.pending_orders  || 0, icon: '⏳', color: '#FF7043' },
          { label: 'Total Page Visits',value: pageViews?.total  || 0, icon: '👁️', color: '#6C63FF' },
          { label: "Today's Visits",   value: pageViews?.today  || 0, icon: '📅', color: '#14C38E' },
          { label: 'Unread Messages',  value: unreadCount       || 0, icon: '💬', color: '#FF3E6C' },
          { label: 'Total Messages',   value: messages.length   || 0, icon: '📩', color: '#6C63FF' },
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

      {/* Most Visited Pages */}
      {pageViews?.topPages?.length > 0 && (
        <div className="adm-card">
          <h3>📊 Most Visited Pages</h3>
          <table className="adm-table">
            <thead><tr><th>#</th><th>Page</th><th>Views</th></tr></thead>
            <tbody>
              {pageViews.topPages.map((p, i) => (
                <tr key={i}>
                  <td><strong>{i + 1}</strong></td>
                  <td>
                    <span>{getPageLabel(p.page)}</span>
                    {/* Product URL hone par original path bhi dikhao */}
                    {/^\/product\/\d+$/.test(p.page) && (
                      <small style={{ color: 'var(--text-muted)' }}>{p.page}</small>
                    )}
                  </td>
                  <td><span className="adm-views-badge">{p.views}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue Chart */}
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

      {/* Recent Messages */}
      {messages.length > 0 && (
        <div className="adm-card">
          <h3>
            💬 Recent Messages
            {unreadCount > 0 && (
              <span className="adm-unread-badge" style={{ marginLeft: 10 }}>{unreadCount} unread</span>
            )}
          </h3>
          <table className="adm-table">
            <thead>
              <tr><th>Name</th><th>Subject</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {messages.slice(0, 5).map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={onViewMessages}>
                  <td><strong>{m.name}</strong><small>{m.email}</small></td>
                  <td>{m.subject || '—'}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: m.status === 'unread'  ? '#0277BD'
                           : m.status === 'replied' ? '#0A7D56' : '#9090A0',
                    }}>
                      {m.status === 'unread' ? '🔵 Unread'
                       : m.status === 'replied' ? '✅ Replied' : '👁️ Read'}
                    </span>
                  </td>
                  <td><small>{new Date(m.created_at).toLocaleDateString('en-IN')}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
          {messages.length > 5 && (
            <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
              <button className="adm-btn-edit" onClick={onViewMessages}>
                View All {messages.length} Messages →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
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
  );
}
