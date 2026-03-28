import React, { useState } from 'react';
import { api } from '../../services/api';
import './InfoPage.css';


export default function ContactPage() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await api.sendContactMessage(form);
    setSent(true);
  } catch (err) {
    alert(err.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="info-page container">
      <div className="info-hero">
        <h1>💬 Contact Us</h1>
        <p>We'd love to hear from you. Send us a message!</p>
      </div>

      <div className="contact-layout">

        {/* Contact Info */}
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>Have a question, feedback, or need help? Our team is here for you.</p>

          <div className="contact-details">
            {[
              { icon: '📧', label: 'Email',    value: 'support@ecommerce.com',  link: 'mailto:support@ecommerce.com' },
              { icon: '📞', label: 'Phone',    value: '1800-001-234 (Free)',     link: 'tel:+911800001234' },
              { icon: '🕐', label: 'Hours',    value: 'Mon–Sat: 9AM – 6PM',     link: null },
              { icon: '📍', label: 'Address',  value: 'New Delhi, India 🇮🇳',   link: null },
            ].map(d => (
              <div key={d.label} className="contact-detail">
                <span className="contact-detail__icon">{d.icon}</span>
                <div>
                  <strong>{d.label}</strong>
                  {d.link
                    ? <a href={d.link}>{d.value}</a>
                    : <span>{d.value}</span>
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="contact-note">
            <h3>📦 Order Issues?</h3>
            <p>For order tracking, cancellations, or delivery issues, please mention your <strong>Order ID</strong> in your message for faster resolution.</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-wrap">
          {sent ? (
            <div className="contact-success">
              <div className="contact-success__icon">🎉</div>
              <h2>Message Sent!</h2>
              <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h2>Send a Message</h2>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="cf-row">
                  <div className="cf-field">
                    <label>Full Name *</label>
                    <input name="name" value={form.name} onChange={handle}
                      placeholder="Your full name" required />
                  </div>
                  <div className="cf-field">
                    <label>Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handle}
                      placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="cf-row">
                  <div className="cf-field">
                    <label>Phone</label>
                    <input name="phone" type="tel" value={form.phone} onChange={handle}
                      placeholder="10-digit number" maxLength={10} />
                  </div>
                  <div className="cf-field">
                    <label>Subject *</label>
                    <select name="subject" value={form.subject} onChange={handle} required>
                      <option value="">Select subject</option>
                      <option value="order">Order Issue</option>
                      <option value="payment">Payment Problem</option>
                      <option value="delivery">Delivery Query</option>
                      <option value="product">Product Query</option>
                      <option value="return">Return/Refund</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="cf-field cf-full">
                  <label>Message *</label>
                  <textarea name="message" value={form.message} onChange={handle}
                    placeholder="Describe your issue or question in detail..."
                    rows={5} required />
                </div>
                <button type="submit" className="cf-submit" disabled={loading}>
                  {loading ? '⏳ Sending...' : '📨 Send Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}