import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Cart.css';

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

export default function Cart() {
  const { items, dispatch, totalPrice, totalItems } = useCart();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const updateQty = (id, qty) =>
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
  const remove = (id) =>
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // ── Cart items ke saath checkout pe navigate karo ──
    navigate('/checkout', {
      state: {
        fromCart: true,
        items,
        totalPrice,
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty__icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some items to get started!</p>
        <Link to="/" className="cart-empty__cta">Continue Shopping</Link>
      </div>
    );
  }

  const delivery = totalPrice >= 999 ? 0 : 49;
  const savings  = items.reduce(
    (sum, i) => sum + (i.originalPrice - i.price) * i.qty, 0
  );

  return (
    <div className="cart-page container">
      <h1 className="cart-title">
        My Cart{' '}
        <span className="cart-count">
          {totalItems} item{totalItems > 1 ? 's' : ''}
        </span>
      </h1>

      <div className="cart-layout">
        {/* Items list */}
        <div className="cart-items">
          {items.map(item => (
            <div className="cart-item" key={item.id}>
              <img
                src={item.image?.startsWith('http') ? item.image : `http://localhost:5000${item.image}`}
                alt={item.name}
                className="cart-item__img"
                onError={e => e.target.style.background = '#f0f0f2'}
              />
              <div className="cart-item__details">
                <p className="cart-item__brand">{item.brand}</p>
                <h3 className="cart-item__name">{item.name}</h3>
                {item.selectedSize  && <p className="cart-item__meta">Size: {item.selectedSize}</p>}
                {item.selectedColor && <p className="cart-item__meta">Color: {item.selectedColor}</p>}
                <div className="cart-item__price-row">
                  <span className="cart-item__price">
                    ₹{(item.price * item.qty).toLocaleString()}
                  </span>
                  <span className="cart-item__orig">
                    ₹{(item.originalPrice * item.qty).toLocaleString()}
                  </span>
                </div>
                <div className="cart-item__actions">
                  <div className="qty-ctrl">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => remove(item.id)}>
                    <TrashIcon /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="cart-summary">
          <h3>Price Details</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Price ({totalItems} items)</span>
              <span>
                ₹{items.reduce((s, i) => s + i.originalPrice * i.qty, 0).toLocaleString()}
              </span>
            </div>
            <div className="summary-row green">
              <span>Discount</span>
              <span>− ₹{savings.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>
                {delivery === 0
                  ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
                  : `₹${delivery}`}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{(totalPrice + delivery).toLocaleString()}</span>
            </div>
          </div>

          {savings > 0 && (
            <div className="summary-savings">
              🎉 You save ₹{savings.toLocaleString()} on this order!
            </div>
          )}

          {!user ? (
            <button className="checkout-btn" onClick={() => navigate('/login')}>
              Login to Place Order
            </button>
          ) : (
            <button className="checkout-btn" onClick={handleCheckout}>
              Place Order
            </button>
          )}

          <p className="safe-pay">🔒 Safe & Secure Payments</p>
        </div>
      </div>
    </div>
  );
}
