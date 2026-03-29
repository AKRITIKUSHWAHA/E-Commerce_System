import React from 'react';
import './InfoPage.css';

export default function AboutPage() {
  return (
    <div className="info-page container">
      <div className="info-hero">
        <h1>🛍️ About Us</h1>
        <p>India's trusted fashion & lifestyle destination</p>
      </div>

      <div className="info-content">
        <div className="info-section">
          <h2>Who We Are</h2>
          <p>Welcome to <strong>E-Commerce</strong> — your one-stop destination for fashion, lifestyle, and more. We are a passionate team dedicated to bringing you the best products at unbeatable prices, right to your doorstep.</p>
          <p>Founded with a vision to make quality fashion accessible to everyone in India, we curate the finest collection of clothing, footwear, and accessories from top brands and emerging designers.</p>
        </div>

        <div className="info-cards">
          {[
            { icon: '🎯', title: 'Our Mission', desc: 'To make premium fashion accessible to every Indian at honest prices with exceptional service.' },
            { icon: '👁️', title: 'Our Vision', desc: 'To become India\'s most trusted and loved fashion destination by 2030.' },
            { icon: '💎', title: 'Our Values', desc: 'Quality, trust, transparency, and customer satisfaction are at the heart of everything we do.' },
          ].map(c => (
            <div key={c.title} className="info-card">
              <span className="info-card__icon">{c.icon}</span>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="info-stats">
          {[
            { value: '10,000+', label: 'Happy Customers' },
            { value: '500+',    label: 'Products'        },
            { value: '50+',     label: 'Top Brands'      },
            { value: '24/7',    label: 'Customer Support'},
          ].map(s => (
            <div key={s.label} className="info-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="info-section">
          <h2>Why Choose Us?</h2>
          <div className="info-features">
            {[
              { icon: '🚚', title: 'Fast Delivery',      desc: 'Get your orders delivered within 3-7 business days across India.' },
              { icon: '✅', title: 'Genuine Products',   desc: '100% authentic products sourced directly from verified sellers.' },
              { icon: '🔒', title: 'Secure Payments',    desc: 'Your payment information is always safe with our encrypted checkout.' },
              { icon: '💬', title: '24/7 Support',       desc: 'Our customer support team is always ready to help you.' },
              { icon: '🎁', title: 'Best Prices',        desc: 'We offer the most competitive prices with regular discounts and offers.' },
              { icon: '↩️', title: 'Easy Process',       desc: 'Simple and hassle-free shopping experience from browse to delivery.' },
            ].map(f => (
              <div key={f.title} className="info-feature">
                <span>{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}