import React from 'react';
import './InfoPage.css';

export default function ReturnsPage() {
  return (
    <div className="info-page container">
      <div className="info-hero">
        <h1>↩️ Returns & Refunds</h1>
        <p>Our return and refund policy explained</p>
      </div>
      <div className="info-content">
        <div className="info-alert">
          ⚠️ <strong>Important:</strong> Most products on our platform are <strong>non-returnable</strong>. Please read the product page carefully before ordering.
        </div>
        {[
          { icon: '✅', title: 'When Returns Are Accepted', content: 'Returns are only accepted if you received a wrong item or a damaged/defective product. Report within 24 hours of delivery with photos.' },
          { icon: '❌', title: 'Non-Returnable Items', content: 'Products marked as "Non-Returnable" cannot be returned. This includes most clothing, innerwear, and sale items.' },
          { icon: '💰', title: 'Refund Process', content: 'Approved refunds are processed within 5–7 business days to your original payment method. COD refunds go to your bank account.' },
          { icon: '📸', title: 'How to Raise a Request', content: 'Go to My Orders → Select Order → Report Issue. Attach clear photos of the damaged/wrong item for faster processing.' },
          { icon: '📞', title: 'Need Help?', content: 'Contact us at support@ecommerce.com or call 1800-001-234 (Mon–Sat 9AM–6PM) for return assistance.' },
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