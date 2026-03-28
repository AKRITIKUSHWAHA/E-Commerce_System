import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">

      {/* ── Top Section ── */}
      <div className="footer__top">
        <div className="container footer__grid">

          {/* Brand */}
          <div className="footer__brand">
            <Link to="/home" className="footer__logo">
              🛍️ <strong>E-Com</strong><span>merce</span>
            </Link>
            <p>
              India ki trusted fashion & lifestyle destination.
              Best price, fastest delivery, genuine products.
            </p>
            <div className="footer__socials">
              <a href="#" aria-label="Instagram" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" title="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              <a href="#" aria-label="YouTube" title="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/home">🏠 Home</Link></li>
              <li><Link to="/home?cat=men">👕 Men</Link></li>
              <li><Link to="/home?cat=women">👗 Women</Link></li>
              <li><Link to="/home?cat=kids">👶 Kids</Link></li>
              <li><Link to="/about">ℹ️ About Us</Link></li>
            </ul>
          </div>

          {/* Customer Help */}
          <div className="footer__col">
            <h4>Customer Help</h4>
            <ul>
              <li><Link to="/shipping">🚚 Shipping Policy</Link></li>
              <li><Link to="/returns">↩️ Returns & Refunds</Link></li>
              <li><Link to="/account">📦 Track Order</Link></li>
              <li><Link to="/faq">❓ FAQ</Link></li>
              <li><Link to="/contact">💬 Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4>Contact Us</h4>
            <ul className="footer__contact">
              <li>
                <span>📧</span>
                <a href="mailto:support@ecommerce.com">support@ecommerce.com</a>
              </li>
              <li>
                <span>📞</span>
                <a href="tel:+911800001234">1800-001-234 (Free)</a>
              </li>
              <li>
                <span>🕐</span>
                <span>Mon–Sat: 9AM – 6PM</span>
              </li>
              <li>
                <span>📍</span>
                <span>New Delhi, India 🇮🇳</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Payment Methods ── */}
      <div className="footer__payments">
        <div className="container footer__payments-inner">
          <span>We Accept:</span>
          <div className="footer__payment-icons">
            {['💳 Visa', '💳 Mastercard', '📱 UPI', '🏦 Net Banking'].map(p => (
              <span key={p} className="footer__payment-badge">{p}</span>
            ))}
          </div>
          <span className="footer__secure">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            100% Secure Payments
          </span>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>
            © 2026 All Rights Reserved | Develop and Design by{' '}
            <strong>Steepray Information Services Private Limited</strong>{' '}
            | MOB: +91-9572146267
          </span>
        </div>
      </div>

    </footer>
  );
}