import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import './Checkout.css';

export default function Checkout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { items: cartItems, dispatch: cartDispatch } = useCart();

  const { product, selectedSize, selectedColor, quantity = 1, fromCart } = location.state || {};
  const isCartCheckout = fromCart || (!product && cartItems.length > 0);

  const getImgUrl = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img}`;
  };

  // ── Items ko useState mein lock karo — cart clear hone se affect nahi hoga ──
  const [checkoutItems] = useState(() => {
    if (isCartCheckout && cartItems.length > 0) {
      return cartItems.map(i => ({
        product_id:    i.id,
        quantity:      i.qty,
        size:          i.selectedSize  || null,
        color:         i.selectedColor || null,
        name:          i.name,
        price:         i.price,
        originalPrice: i.originalPrice,
        image:         i.image,
        brand:         i.brand,
      }));
    }
    if (product) {
      return [{
        product_id:    product.id,
        quantity,
        size:          selectedSize  || null,
        color:         selectedColor || null,
        name:          product.name,
        price:         product.price,
        originalPrice: product.originalPrice,
        image:         product.image,
        brand:         product.brand,
      }];
    }
    return [];
  });

  const subtotal   = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const mrpTotal   = checkoutItems.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
  const savings    = mrpTotal - subtotal;
  const delivery   = subtotal >= 999 ? 0 : 49;
  const grandTotal = subtotal + delivery;

  const [step,           setStep]           = useState(1);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [orderId,        setOrderId]        = useState(null);
  const [paymentId,      setPaymentId]      = useState(null);
  const [savedAddress,   setSavedAddress]   = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);


  const [form, setForm] = useState({
    name:       user?.name  || '',
    email:      user?.email || '',
    phone:      '',
    altPhone:   '',
    address:    '',
    landmark:   '',
    city:       '',
    state:      '',
    pincode:    '',
  });

  // Refs for Razorpay handler
  const formRef       = useRef(form);
  const itemsRef      = useRef(checkoutItems);
  const totalRef      = useRef(grandTotal);
  const isCartRef     = useRef(isCartCheckout);

  useEffect(() => { formRef.current  = form; },       [form]);
  useEffect(() => { totalRef.current = grandTotal; },  [grandTotal]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch(e) {} };
  }, []);

  // ── Empty check — sirf tab dikhao jab step 3 nahi hai ──
  if (checkoutItems.length === 0 && step !== 3) {
    return (
      <div className="checkout-empty">
        <span>🛒</span>
        <h2>No product selected</h2>
        <Link to="/home" className="co-btn-primary">← Continue Shopping</Link>
      </div>
    );
  }

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validateForm = () => {
    if (!form.name.trim())             return 'Name is required';
    if (!form.email.trim())            return 'Email is required';
    if (!/^\d{10}$/.test(form.phone))  return 'Please enter a valid 10-digit mobile number';
    if (!form.address.trim())          return 'Address is required';
    if (!form.city.trim())             return 'City is required';
    if (!form.state.trim())            return 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) return 'Please enter a valid 6-digit pincode';
    return null;
  };

  const handleProceed = () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const f     = formRef.current;
      const items = itemsRef.current;
      const total = totalRef.current;
      const addr  = `${f.address}${f.landmark ? ', ' + f.landmark : ''}, ${f.city}, ${f.state} - ${f.pincode}`;

      const rzpOrderData = await api.createRazorpayOrder({
        amount:  total,
        receipt: `order_${Date.now()}`,
      });

      const options = {
        key:         rzpOrderData.key,
        amount:      rzpOrderData.amount,
        currency:    rzpOrderData.currency,
        name:        'E-Commerce Store',
        description: `${items.length} item${items.length > 1 ? 's' : ''}`,
        order_id:    rzpOrderData.orderId,
        image:       getImgUrl(items[0]?.image),
        prefill: { name: f.name, email: f.email, contact: f.phone },
        theme: { color: '#FF3E6C' },

        handler: async (response) => {
          try {
            const orderData = await api.verifyAndPlaceOrder({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              customer_name:  f.name,
              customer_email: f.email,
              customer_phone: f.phone,
              address:        addr,
              items: items.map(i => ({
                product_id: i.product_id,
                quantity:   i.quantity,
                size:       i.size  || null,
                color:      i.color || null,
              })),
            });

            // Address save karo pehle
            setSavedAddress(addr);
            setOrderId(orderData.orderId);
            setPaymentId(response.razorpay_payment_id);
            setLoading(false);

            // Cart clear karo — checkoutItems already locked hain useState mein
            if (isCartRef.current) {
              cartDispatch({ type: 'CLEAR_CART' });
            }

            // Step 3 pe jaao
            setStep(3);

          } catch (err) {
            setError('Payment successful but order saving failed. Please contact support.');
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setError('Payment cancelled. Please try again.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // ── Step 3: Success ──
  if (step === 3) {
    return (
      <div className="checkout-success">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h1>Order Placed Successfully!</h1>
          <p>Order ID: <strong>#{orderId}</strong></p>
          {paymentId && <p className="success-payment-id">Payment ID: <strong>{paymentId}</strong></p>}
          <p className="success-sub">Confirmation sent to <strong>{form.email}</strong></p>

          <div className="success-items">
            {checkoutItems.map((item, i) => (
              <div key={i} className="success-product">
                <img src={getImgUrl(item.image)} alt={item.name}
                  onError={e => e.target.style.display = 'none'} />
                <div>
                  <strong>{item.name}</strong>
                  {item.size  && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="success-address">
            <p>📍 {savedAddress}</p>
            <p>📞 {form.phone}{form.altPhone ? ` | Alt: ${form.altPhone}` : ''}</p>
          </div>

          <div className="success-total">
            <strong>Total Paid: ₹{grandTotal.toLocaleString()}</strong>
          </div>

          <div className="success-badges">
            <span className="success-badge paid">✅ Payment Confirmed</span>
            <span className="success-badge processing">📦 Order Confirmed</span>
          </div>

          <div className="success-btns">
            <Link to="/account" className="co-btn-secondary">View My Orders</Link>
            <Link to="/home" className="co-btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      <div className="co-steps">
        {['Delivery Address', 'Review Order', 'Payment'].map((s, i) => (
          <div key={s} className={`co-step ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
            <div className="co-step-circle">{step > i+1 ? '✓' : i+1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="co-layout">
        <div className="co-left">

          {step === 1 && (
            <div className="co-card">
              <h2>📍 Delivery Address</h2>
              <div className="co-form-grid">
                <div className="co-field co-full">
                  <label>Full Name *</label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Your full name" />
                </div>
                <div className="co-field">
                  <label>Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handle} placeholder="email@example.com" />
                </div>
                <div className="co-field">
                  <label>Mobile Number *</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handle} placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <div className="co-field co-full">
                  <label>Address *</label>
                  <textarea name="address" value={form.address} onChange={handle}
                    placeholder="House No., Street, Area" rows={3} />
                </div>
                <div className="co-field co-full">
                  <label>Landmark <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                  <input name="landmark" value={form.landmark} onChange={handle} placeholder="e.g. Near City Mall, Opposite Park" />
                </div>
                <div className="co-field">
                  <label>City *</label>
                  <input name="city" value={form.city} onChange={handle} placeholder="City" />
                </div>
                <div className="co-field">
                  <label>State *</label>
                  <input name="state" value={form.state} onChange={handle} placeholder="State" />
                </div>
                <div className="co-field">
                  <label>Pincode *</label>
                  <input name="pincode" value={form.pincode} onChange={handle} placeholder="6-digit pincode" maxLength={6} />
                </div>
                <div className="co-field">
                  <label>Alternative Number <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                  <input name="altPhone" type="tel" value={form.altPhone} onChange={handle} placeholder="10-digit alternate number" maxLength={10} />
                </div>
              </div>
              {error && <div className="co-error">⚠️ {error}</div>}
              <button className="co-btn-primary co-full-btn" onClick={handleProceed}>Review Order →</button>
            </div>
          )}

          {step === 2 && (
            <div className="co-card">
              <h2>📋 Review Your Order</h2>

              <div className="co-review-section">
                <div className="co-review-header">
                  <h3>📍 Delivery Address</h3>
                  <button onClick={() => setStep(1)}>Edit</button>
                </div>
                <p><strong>{form.name}</strong></p>
                <p>{form.address}{form.landmark ? `, ${form.landmark}` : ''}, {form.city}, {form.state} - {form.pincode}</p>
                <p>📞 {form.phone}{form.altPhone ? ` | Alt: ${form.altPhone}` : ''} &nbsp;|&nbsp; ✉️ {form.email}</p>
              </div>

              <div className="co-review-section">
                <h3>🛍️ Order Items ({checkoutItems.length})</h3>
                {checkoutItems.map((item, i) => (
                  <div key={i} className="co-item">
                    <img src={getImgUrl(item.image)} alt={item.name} onError={e => e.target.style.display='none'} />
                    <div className="co-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.brand}</span>
                      {item.size  && <span>Size: <b>{item.size}</b></span>}
                      {item.color && <span>Color: <b>{item.color}</b></span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className="co-item-price">
                      <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                      <small>₹{(item.originalPrice * item.quantity).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="co-review-section">
                <h3>💰 Price Summary</h3>
                <div className="co-price-rows">
                  <div className="co-price-row"><span>MRP</span><span>₹{mrpTotal.toLocaleString()}</span></div>
                  <div className="co-price-row"><span>Discount</span><span className="green">− ₹{savings.toLocaleString()}</span></div>
                  <div className="co-price-row">
                    <span>Delivery</span>
                    <span className={delivery === 0 ? 'green' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
                  </div>
                  <div className="co-price-row total-row"><span>Total Payable</span><span>₹{grandTotal.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="co-review-section">
                <h3>💳 Payment Method</h3>
                <div className="co-payment-options">
                  <div className="co-payment-option active">
                    <div className="co-payment-option__left">
                      <div className="co-payment-radio" />
                      <div><strong>Pay Online</strong><span>UPI, Cards, Net Banking, Wallets</span></div>
                    </div>
                    <div className="co-payment-logos"><span>UPI</span><span>VISA</span><span>MC</span></div>
                  </div>
                </div>
                <div className="co-secure-badge">🔒 100% Secure payments powered by Razorpay</div>
              </div>

{/* ── Return Policy Disclaimer ── */}
<div className="co-disclaimer">
  <div className="co-disclaimer__header">
    <span>⚠️</span>
    <strong>Return & Refund Policy</strong>
  </div>
  <ul className="co-disclaimer__list">
    <li>🚫 <strong>No Return Policy:</strong> All sales are final. Products cannot be returned once delivered.</li>
    <li>📦 <strong>Check Before Accept:</strong> Please inspect your package before accepting delivery.</li>
    <li>❌ <strong>No Refund:</strong> Refunds are not applicable after order is delivered.</li>
    <li>✅ <strong>Exception:</strong> Wrong or damaged item complaints accepted within 24 hours of delivery only.</li>
    <li>📞 <strong>Support:</strong> Contact us at support@ecommerce.com for any issues.</li>
  </ul>
  <label className="co-disclaimer__agree">
    <input type="checkbox" checked={agreedToPolicy} onChange={e => setAgreedToPolicy(e.target.checked)} />
    <span>I have read and agree to the <strong>Return & Refund Policy</strong></span>
  </label>
</div>

{error && <div className="co-error">⚠️ {error}</div>}
<button className="co-btn-pay co-full-btn" onClick={handlePayment} disabled={loading || !agreedToPolicy}>                {loading ? '⏳ Processing...' : `🔒 Pay ₹${grandTotal.toLocaleString()} Securely`}
              </button>
              <button className="co-btn-back" onClick={() => setStep(1)}>← Edit Address</button>
            </div>
          )}
        </div>

        <div className="co-right">
          <div className="co-summary">
            <h2>Price Details</h2>
            <div className="co-summary-items">
              {checkoutItems.map((item, i) => (
                <div key={i} className="co-summary-item">
                  <img src={getImgUrl(item.image)} alt={item.name} onError={e => e.target.style.display='none'} />
                  <div>
                    <strong>{item.name}</strong>
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="co-summary-rows">
              <div className="co-summary-row">
                <span>Price ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₹{mrpTotal.toLocaleString()}</span>
              </div>
              <div className="co-summary-row"><span>Discount</span><span className="green">− ₹{savings.toLocaleString()}</span></div>
              <div className="co-summary-row">
                <span>Delivery</span>
                <span className={delivery === 0 ? 'green' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>
            </div>
            <div className="co-summary-total"><span>Total Amount</span><span>₹{grandTotal.toLocaleString()}</span></div>
            <div className="co-summary-saving">🎉 You save ₹{savings.toLocaleString()} on this order!</div>
            <div className="co-summary-secure">🔒 Safe & Secure Payments</div>
          </div>
        </div>
      </div>
    </div>
  );
}
