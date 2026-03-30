import React from 'react';

export function generateInvoice(order) {
  // Dynamic import to avoid SSR issues
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      createInvoicePDF(order, jsPDF, autoTable);
    });
  });
}

function createInvoicePDF(order, jsPDF, autoTable) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width
  const margin = 14;

  // ══════════════════════════════════════════
  //  COLOR PALETTE
  // ══════════════════════════════════════════
  const pink    = [255, 62, 108];
  const dark    = [30,  30,  40];
  const gray    = [120, 120, 135];
  const light   = [245, 245, 250];
  const white   = [255, 255, 255];
  const green   = [10,  125,  86];
  const border  = [220, 220, 228];

  // ══════════════════════════════════════════
  //  HELPER FUNCTIONS
  // ══════════════════════════════════════════
  const setFont = (size, style = 'normal', color = dark) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };

  const drawRect = (x, y, w, h, color, radius = 0) => {
    doc.setFillColor(...color);
    if (radius > 0) {
      doc.roundedRect(x, y, w, h, radius, radius, 'F');
    } else {
      doc.rect(x, y, w, h, 'F');
    }
  };

  const drawLine = (x1, y1, x2, y2, color = border, width = 0.3) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
  };

  const text = (txt, x, y, opts = {}) => {
    doc.text(String(txt), x, y, opts);
  };

  // ══════════════════════════════════════════
  //  HEADER SECTION
  // ══════════════════════════════════════════
  // Pink gradient header background
  drawRect(0, 0, W, 48, pink);

  // Company Logo area
  drawRect(margin, 8, 32, 32, white, 4);
  setFont(18, 'bold', pink);
  text('E', margin + 7, 22);
  setFont(8, 'normal', pink);
  text('Commerce', margin + 4, 30);

  // Company name & tagline
  setFont(22, 'bold', white);
  text('E-COMMERCE', margin + 38, 20);
  setFont(9, 'normal', [255, 200, 210]);
  text('India ki Trusted Fashion & Lifestyle Destination', margin + 38, 27);

  // INVOICE label (right side)
  setFont(28, 'bold', white);
  text('INVOICE', W - margin, 22, { align: 'right' });
  setFont(9, 'normal', [255, 200, 210]);
  text(`#INV-${String(order.id).padStart(6, '0')}`, W - margin, 30, { align: 'right' });

  // Contact info strip
  drawRect(0, 48, W, 12, [240, 240, 245]);
  setFont(8, 'normal', gray);
  text('📧 support@ecommerce.com', margin, 56);
  text('📞 1800-001-234 (Free)', 80, 56);
  text('🌐 www.ecommerce.com', 140, 56);
  text('📍 New Delhi, India', W - margin, 56, { align: 'right' });

  // ══════════════════════════════════════════
  //  ORDER INFO BOXES
  // ══════════════════════════════════════════
  let y = 70;

  // Left box — Bill To
  drawRect(margin, y, 85, 38, light, 3);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, 85, 38, 3, 3, 'S');

  setFont(7, 'bold', pink);
  text('BILL TO', margin + 4, y + 7);
  drawLine(margin + 4, y + 9, margin + 81, y + 9, pink, 0.5);

  setFont(10, 'bold', dark);
  text(order.customer_name || 'Customer', margin + 4, y + 17);
  setFont(8, 'normal', gray);

  // Address wrap
  const addr = order.address || 'Address not provided';
  const addrLines = doc.splitTextToSize(addr, 77);
  addrLines.slice(0, 2).forEach((line, i) => {
    text(line, margin + 4, y + 24 + (i * 5));
  });
  text(`📞 ${order.customer_phone || 'N/A'}`, margin + 4, y + 34);

  // Middle box — Order Details
  drawRect(105, y, 48, 38, light, 3);
  doc.roundedRect(105, y, 48, 38, 3, 3, 'S');

  setFont(7, 'bold', pink);
  text('ORDER DETAILS', 109, y + 7);
  drawLine(109, y + 9, 149, y + 9, pink, 0.5);

  setFont(7, 'normal', gray);
  text('Order ID', 109, y + 16);
  text('Date', 109, y + 22);
  text('Payment', 109, y + 28);
  text('Status', 109, y + 34);

  setFont(7, 'bold', dark);
  text(`#${order.id}`, 149, y + 16, { align: 'right' });
  text(new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }), 149, y + 22, { align: 'right' });
  text(order.payment_method || 'N/A', 149, y + 28, { align: 'right' });

  // Payment status badge
  const isPaid = order.payment_status === 'paid';
  drawRect(131, y + 30, 18, 6, isPaid ? green : [255, 150, 0], 2);
  setFont(6, 'bold', white);
  text(isPaid ? '✓ PAID' : 'PENDING', 140, y + 34.5, { align: 'center' });

  // Right box — Invoice Meta
  drawRect(159, y, 37, 38, [255, 62, 108, 0.1], 3);
  drawRect(159, y, 37, 38, pink, 3);
  doc.roundedRect(159, y, 37, 38, 3, 3, 'S');

  setFont(7, 'bold', white);
  text('INVOICE DATE', 163, y + 7);
  drawLine(163, y + 9, 192, y + 9, white, 0.3);

  setFont(9, 'bold', white);
  text(new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }), 177.5, y + 19, { align: 'center' });

  setFont(7, 'normal', [255, 200, 210]);
  text('Invoice #', 163, y + 27);
  setFont(8, 'bold', white);
  text(`INV-${String(order.id).padStart(6, '0')}`, 177.5, y + 34, { align: 'center' });

  // ══════════════════════════════════════════
  //  ITEMS TABLE
  // ══════════════════════════════════════════
  y += 48;

  // Table header
  setFont(8, 'bold', white);
  drawRect(margin, y, W - margin * 2, 9, pink);

  const cols = {
    no:    { x: margin + 3,   w: 8   },
    item:  { x: margin + 13,  w: 80  },
    qty:   { x: margin + 100, w: 20  },
    price: { x: margin + 123, w: 28  },
    total: { x: W - margin,   w: 28  },
  };

  text('#',       cols.no.x,    y + 6);
  text('PRODUCT', cols.item.x,  y + 6);
  text('QTY',     cols.qty.x,   y + 6);
  text('PRICE',   cols.price.x, y + 6);
  text('TOTAL',   cols.total.x, y + 6, { align: 'right' });

  y += 9;

  // Table rows
  const items = order.items || [];
  items.forEach((item, i) => {
    const rowH  = 14;
    const isEven = i % 2 === 0;

    // Row background
    drawRect(margin, y, W - margin * 2, rowH, isEven ? light : white);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, W - margin * 2, rowH, 'S');

    // Serial number
    setFont(8, 'bold', pink);
    text(String(i + 1).padStart(2, '0'), cols.no.x, y + 9);

    // Product name + details
    setFont(9, 'bold', dark);
    const productName = doc.splitTextToSize(item.product_name || 'Product', 76);
    text(productName[0], cols.item.x, y + 6);

    setFont(7, 'normal', gray);
    const details = [];
    if (item.size)  details.push(`Size: ${item.size}`);
    if (item.color) details.push(`Color: ${item.color}`);
    if (details.length > 0) text(details.join('  |  '), cols.item.x, y + 11);

    // Quantity
    setFont(9, 'normal', dark);
    text(String(item.quantity), cols.qty.x + 8, y + 8, { align: 'center' });

    // Price
    setFont(9, 'normal', dark);
    text(`₹${Number(item.price).toLocaleString('en-IN')}`, cols.price.x + 14, y + 8, { align: 'center' });

    // Total
    const itemTotal = item.price * item.quantity;
    setFont(9, 'bold', dark);
    text(`₹${Number(itemTotal).toLocaleString('en-IN')}`, cols.total.x, y + 8, { align: 'right' });

    y += rowH;
  });

  // ══════════════════════════════════════════
  //  TOTALS SECTION
  // ══════════════════════════════════════════
  y += 4;

  const subtotal   = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const shipping   = subtotal >= 999 ? 0 : 49;
  const total      = subtotal + shipping;
  const totalRight = W - margin;
  const labelLeft  = W - margin - 60;

  // Summary box
  drawRect(labelLeft - 4, y, 68, 40, light, 3);
  doc.setDrawColor(...border);
  doc.roundedRect(labelLeft - 4, y, 68, 40, 3, 3, 'S');

  setFont(8, 'normal', gray);
  text('Subtotal',  labelLeft, y + 9);
  text(`₹${Number(subtotal).toLocaleString('en-IN')}`, totalRight, y + 9, { align: 'right' });

  text('Shipping',  labelLeft, y + 16);
  if (shipping === 0) {
    setFont(8, 'bold', green);
    text('FREE', totalRight, y + 16, { align: 'right' });
  } else {
    setFont(8, 'normal', dark);
    text(`₹${shipping}`, totalRight, y + 16, { align: 'right' });
  }

  text('Tax (GST)', labelLeft, y + 23);
  setFont(8, 'normal', dark);
  text('Included', totalRight, y + 23, { align: 'right' });

  // Total line
  drawLine(labelLeft - 2, y + 27, totalRight, y + 27, pink, 0.5);

  setFont(10, 'bold', dark);
  text('TOTAL', labelLeft, y + 35);
  setFont(12, 'bold', pink);
  text(`₹${Number(total).toLocaleString('en-IN')}`, totalRight, y + 35, { align: 'right' });

  // Payment badge (left of summary)
  if (isPaid) {
    drawRect(margin, y + 2, 32, 14, [232, 255, 245], 3);
    doc.setDrawColor(...green);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y + 2, 32, 14, 3, 3, 'S');
    setFont(7, 'bold', green);
    text('✓ PAYMENT', margin + 16, y + 8, { align: 'center' });
    text('RECEIVED', margin + 16, y + 13, { align: 'center' });
  }

  // ══════════════════════════════════════════
  //  NOTES & TERMS
  // ══════════════════════════════════════════
  y += 52;

  if (y < 240) {
    drawRect(margin, y, 88, 24, light, 3);
    doc.roundedRect(margin, y, 88, 24, 3, 3, 'S');

    setFont(7, 'bold', pink);
    text('NOTES', margin + 4, y + 7);
    setFont(7, 'normal', gray);
    text('• Thank you for shopping with us!', margin + 4, y + 13);
    text('• For returns, contact within 24 hours of delivery.', margin + 4, y + 18);
    text('• Keep this invoice for your records.', margin + 4, y + 23);
  }

  // ══════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════
  const footerY = 278;

  drawRect(0, footerY, W, 20, pink);

  setFont(8, 'bold', white);
  text('Thank you for your purchase! 🛍️', W / 2, footerY + 8, { align: 'center' });

  setFont(7, 'normal', [255, 200, 210]);
  text(
    '© 2026 Steepray Information Services Pvt. Ltd. | MOB: +91-9572146267 | support@ecommerce.com',
    W / 2, footerY + 15, { align: 'center' }
  );

  // ══════════════════════════════════════════
  //  WATERMARK (agar paid ho)
  // ══════════════════════════════════════════
  if (isPaid) {
    doc.setTextColor(0, 200, 120, 0.08);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    doc.text('PAID', W / 2, 160, { align: 'center', angle: 45 });
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  // ══════════════════════════════════════════
  //  SAVE
  // ══════════════════════════════════════════
  doc.save(`Invoice_${String(order.id).padStart(6, '0')}_${order.customer_name?.replace(/\s+/g, '_') || 'Customer'}.pdf`);
}