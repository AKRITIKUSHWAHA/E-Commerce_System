import React, { useState } from 'react';
import './InfoPage.css';

const faqs = [
  { q: 'How do I place an order?',             a: 'Browse products → Add to Cart or click Shop Now → Fill delivery details → Pay securely. Done!' },
  { q: 'What payment methods are accepted?',   a: 'We accept UPI, Debit/Credit Cards, Net Banking, Wallets, and Cash on Delivery (COD).' },
  { q: 'How do I track my order?',             a: 'Go to My Account → My Orders → Click on the order to see real-time tracking status.' },
  { q: 'Can I cancel my order?',               a: 'Orders can be cancelled before they are shipped. Contact support immediately if you want to cancel.' },
  { q: 'Are the products genuine?',            a: 'Yes! All products are 100% authentic and sourced from verified sellers only.' },
  { q: 'What if I receive a wrong product?',   a: 'Contact us within 24 hours with photos. We will arrange a replacement or refund immediately.' },
  { q: 'Is my payment information safe?',      a: 'Absolutely! We use 256-bit SSL encryption and never store your card details.' },
  { q: 'How long does delivery take?',         a: 'Standard delivery: 3–7 business days. Express delivery: 1–2 days (select areas).' },
  { q: 'Do you deliver outside India?',        a: 'Currently we only deliver within India. International shipping coming soon!' },
  { q: 'How do I contact customer support?',   a: 'Email: support@ecommerce.com | Phone: 1800-001-234 | Available Mon–Sat 9AM–6PM.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);
  return (
    <div className="info-page container">
      <div className="info-hero">
        <h1>❓ Frequently Asked Questions</h1>
        <p>Find answers to common questions</p>
      </div>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
              <span>{faq.q}</span>
              <span className="faq-icon">{open === i ? '▲' : '▼'}</span>
            </button>
            {open === i && (
              <div className="faq-answer">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}