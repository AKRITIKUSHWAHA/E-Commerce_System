import React from 'react';
import './InfoPage.css';

export default function ShippingPage() {
  return (
    <div className="info-page container">
      <div className="info-hero">
        <h1>🚚 Shipping Policy</h1>
        <p>Everything you need to know about delivery</p>
      </div>
      <div className="info-content">
        {[
          { icon: '⏱️', title: 'Delivery Time', content: 'Standard delivery takes 3–7 business days. Express delivery (1–2 days) available for select pincodes at extra charge.' },
          { icon: '💰', title: 'Shipping Charges', content: 'FREE shipping on orders above ₹999. Orders below ₹999 have a flat ₹49 delivery charge.' },
          { icon: '📍', title: 'Delivery Areas', content: 'We deliver to 20,000+ pincodes across India. Enter your pincode at checkout to check availability.' },
          { icon: '📦', title: 'Order Tracking', content: 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also track it in My Orders.' },
          { icon: '🏢', title: 'Courier Partners', content: 'We work with trusted courier partners like Delhivery, BlueDart, and Ekart for reliable delivery.' },
          { icon: '⚠️', title: 'Delays', content: 'Delivery may be delayed during festivals, bad weather, or remote areas. We will notify you in case of any delay.' },
        ].map(item => (
          <div key={item.title} className="info-policy-item">
            <div className="info-policy-icon">{item.icon}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}