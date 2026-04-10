import React, { useState } from 'react';
import { api } from '../../../services/api';
import { Badge, getImgUrl } from '../AdminDashboard';

export default function TabOrders({ orders, setOrders, flash }) {
  const [expandedOrder,     setExpandedOrder]     = useState(null);
  const [orderDateFilter,   setOrderDateFilter]   = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const getFiltered = () => {
    let list = [...orders];
    if (orderDateFilter) {
      list = list.filter(o =>
        new Date(o.created_at).toLocaleDateString('en-CA') === orderDateFilter
      );
    }
    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }
    return list;
  };

  const updateOrder = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      flash('Order status updated');
    } catch (err) { flash(err.message, true); }
  };

  const filteredOrders = getFiltered();

  return (
    <div className="adm-content">

      {/* ── Filters ── */}
      <div className="adm-order-filters">

        {/* Row 1: Date + Status side by side */}
        <div className="adm-order-filters__row">

          <div className="adm-filter-group">
            <label>📅 FILTER BY DATE</label>
            <div className="adm-filter-group__row">
              <input
                type="date"
                value={orderDateFilter}
                onChange={e => setOrderDateFilter(e.target.value)}
                className="adm-filter-input"
              />
              {orderDateFilter && (
                <button className="adm-filter-clear" onClick={() => setOrderDateFilter('')}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className="adm-filter-group">
            <label>📦 FILTER BY STATUS</label>
            <div className="adm-filter-group__row">
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="adm-select adm-select--md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Result count + Clear All */}
          {(orderDateFilter || orderStatusFilter !== 'all') && (
            <div className="adm-filter-result">
              <span>{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found</span>
              <button
                className="adm-filter-clear"
                onClick={() => { setOrderDateFilter(''); setOrderStatusFilter('all'); }}
              >
                ✕ Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {filteredOrders.length === 0 ? (
        <div className="adm-empty">
          <span>🛒</span>
          <p>{orders.length === 0 ? 'No orders right now.' : 'No orders match the selected filter.'}</p>
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <React.Fragment key={o.id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                    >
                      <td><strong>#{o.id}</strong></td>

                      <td style={{ minWidth: 140 }}>
                        <strong>{o.customer_name}</strong>
                        <small>{o.customer_email}</small>
                        <small>📞 {o.customer_phone}</small>
                      </td>

                      <td style={{ minWidth: 180 }}>
                        <div className="adm-order-items-preview">
                          {o.items && o.items.length > 0 ? (
                            <>
                              {o.items.slice(0, 2).map((item, i) => {
                                const imgUrl = getImgUrl(item.image);
                                return (
                                  <div key={i} className="adm-order-item-preview">
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={item.product_name}
                                        onError={e => e.target.style.display = 'none'} />
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

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>₹{Number(o.total_amount).toLocaleString()}</strong>
                      </td>

                      <td>
                        <span className="adm-badge badge-info">{o.payment_method}</span>
                      </td>

                      <td>
                        <Badge status={o.status} />
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <small>
                          {new Date(o.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </small>
                      </td>

                      <td onClick={e => e.stopPropagation()} style={{ minWidth: 130 }}>
                        {!['delivered', 'cancelled'].includes(o.status) && (
                          <select
                            className="adm-select"
                            value={o.status}
                            onChange={e => updateOrder(o.id, e.target.value)}
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedOrder === o.id && (
                      <tr className="adm-order-detail-row">
                        <td colSpan={8}>
                          <div className="adm-order-detail">

                            <div className="adm-order-detail__section">
                              <h4>📍 Delivery Details</h4>
                              <div className="adm-order-detail__grid">
                                <div><span>Customer Name</span><strong>{o.customer_name}</strong></div>
                                <div><span>Phone</span><strong>{o.customer_phone}</strong></div>
                                <div><span>Email</span><strong>{o.customer_email}</strong></div>
                                <div className="adm-full"><span>Delivery Address</span><strong>{o.address}</strong></div>
                              </div>
                            </div>

                            <div className="adm-order-detail__section">
                              <h4>🛒 Ordered Items</h4>
                              {o.items?.map((item, i) => (
                                <div key={i} className="adm-order-detail__item">
                                  {getImgUrl(item.image) && (
                                    <img src={getImgUrl(item.image)} alt={item.product_name}
                                      onError={e => e.target.style.display = 'none'} />
                                  )}
                                  <div>
                                    <strong>{item.product_name}</strong>
                                    <small>
                                      {item.size  && `Size: ${item.size}`}
                                      {item.color && ` | Color: ${item.color}`}
                                      {` | Qty: ${item.quantity}`}
                                    </small>
                                  </div>
                                  <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                                </div>
                              ))}
                            </div>

                            <div className="adm-order-detail__section">
                              <h4>💳 Payment Info</h4>
                              <div className="adm-order-detail__grid">
                                <div><span>Method</span><strong>{o.payment_method}</strong></div>
                                <div>
                                  <span>Status</span>
                                  <strong style={{ color: o.payment_status === 'paid' ? '#0A7D56' : '#B37A00' }}>
                                    {o.payment_status}
                                  </strong>
                                </div>
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
        </div>
      )}
    </div>
  );
}
