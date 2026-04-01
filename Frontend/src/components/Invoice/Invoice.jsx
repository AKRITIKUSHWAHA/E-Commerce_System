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

  // Improved text function to handle character issues
  const text = (txt, x, y, opts = {}) => {
    const safeTxt = String(txt).replace(/[^\x00-\x7F]/g, ""); 
    doc.text(safeTxt || String(txt), x, y, opts);
  };

  // ══════════════════════════════════════════
  //  HEADER SECTION
  // ══════════════════════════════════════════
  drawRect(0, 0, W, 48, pink);

  drawRect(margin, 8, 32, 32, white, 4);
  setFont(18, 'bold', pink);
  text('E', margin + 7, 22);
  setFont(8, 'normal', pink);
  text('Commerce', margin + 4, 30);

  setFont(20, 'bold', white);
  text('E-COMMERCE', margin + 38, 20);
  setFont(8, 'normal', [255, 200, 210]);
  text('India ki Trusted Fashion & Lifestyle Destination', margin + 38, 27);

  setFont(26, 'bold', white);
  text('INVOICE', W - margin, 22, { align: 'right' });
  setFont(9, 'normal', [255, 200, 210]);
  text(`#INV-${String(order.id).padStart(6, '0')}`, W - margin, 30, { align: 'right' });

  drawRect(0, 48, W, 12, [240, 240, 245]);
  setFont(8, 'normal', gray);
  text('Email: support@ecommerce.com', margin, 56);
  text('Call: 1800-001-234', 90, 56);
  text('New Delhi, India', W - margin, 56, { align: 'right' });

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

  const addr = order.address || 'Address not provided';
  const addrLines = doc.splitTextToSize(addr, 75);
  addrLines.slice(0, 2).forEach((line, i) => {
    text(line, margin + 4, y + 24 + (i * 5));
  });
  text(`Ph: ${order.customer_phone || 'N/A'}`, margin + 4, y + 34);

  // Middle box — Order Details
  drawRect(105, y, 48, 38, light, 3);
  doc.roundedRect(105, y, 48, 38, 3, 3, 'S');

  setFont(7, 'bold', pink);
  text('ORDER INFO', 109, y + 7);
  drawLine(109, y + 9, 149, y + 9, pink, 0.5);

  setFont(7, 'normal', gray);
  text('Order ID', 109, y + 15);
  text('Date', 109, y + 21);
  text('Payment', 109, y + 27);
  text('Status', 109, y + 33);

  setFont(7, 'bold', dark);
  text(`#${order.id}`, 149, y + 15, { align: 'right' });
  text(new Date(order.created_at).toLocaleDateString('en-IN'), 149, y + 21, { align: 'right' });
  text(order.payment_method || 'N/A', 149, y + 27, { align: 'right' });

  const isPaid = order.payment_status === 'paid';
  drawRect(138, y + 30, 10, 5, isPaid ? green : [255, 150, 0], 1);
  setFont(5, 'bold', white);
  text(isPaid ? 'PAID' : 'PENDING', 143, y + 33.5, { align: 'center' });

  // Right box — Invoice Meta
  drawRect(159, y, 37, 38, pink, 3);
  setFont(7, 'bold', white);
  text('INVOICE DATE', 163, y + 7);
  drawLine(163, y + 9, 192, y + 9, white, 0.3);

  setFont(9, 'bold', white);
  text(new Date().toLocaleDateString('en-IN'), 177.5, y + 19, { align: 'center' });
  setFont(7, 'normal', [255, 200, 210]);
  text('Invoice #', 163, y + 27);
  setFont(8, 'bold', white);
  text(`INV-${String(order.id).padStart(6, '0')}`, 177.5, y + 34, { align: 'center' });

  // ══════════════════════════════════════════
  //  ITEMS TABLE
  // ══════════════════════════════════════════
  y += 48;
  setFont(8, 'bold', white);
  drawRect(margin, y, W - margin * 2, 9, pink);

  const cols = {
    no:    { x: margin + 3 },
    item:  { x: margin + 13 },
    qty:   { x: margin + 105 },
    price: { x: margin + 130 },
    total: { x: W - margin },
  };

  text('#', cols.no.x, y + 6);
  text('PRODUCT', cols.item.x, y + 6);
  text('QTY', cols.qty.x, y + 6);
  text('PRICE', cols.price.x, y + 6);
  text('TOTAL', cols.total.x, y + 6, { align: 'right' });

  y += 9;
  const items = order.items || [];
  items.forEach((item, i) => {
    const rowH = 14;
    const isEven = i % 2 === 0;
    drawRect(margin, y, W - margin * 2, rowH, isEven ? light : white);
    doc.setDrawColor(...border);
    doc.rect(margin, y, W - margin * 2, rowH, 'S');

    setFont(8, 'bold', pink);
    text(String(i + 1).padStart(2, '0'), cols.no.x, y + 9);

    setFont(9, 'bold', dark);
    text(String(item.product_name).substring(0, 35), cols.item.x, y + 6);
    setFont(7, 'normal', gray);
    text(`Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}`, cols.item.x, y + 11);

    setFont(9, 'normal', dark);
    text(String(item.quantity), cols.qty.x + 3, y + 8);
    text(`Rs. ${Number(item.price).toLocaleString('en-IN')}`, cols.price.x, y + 8);
    text(`Rs. ${Number(item.price * item.quantity).toLocaleString('en-IN')}`, cols.total.x, y + 8, { align: 'right' });

    y += rowH;
  });

  // ══════════════════════════════════════════
  //  TOTALS SECTION
  // ══════════════════════════════════════════
  y += 5;
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;
  const totalRight = W - margin;
  const labelLeft = W - margin - 60;

  drawRect(labelLeft - 4, y, 68, 35, light, 3);
  doc.roundedRect(labelLeft - 4, y, 68, 35, 3, 3, 'S');
  
  setFont(8, 'normal', gray);
  text('Subtotal', labelLeft, y + 8);
  text(`Rs. ${subtotal.toLocaleString('en-IN')}`, totalRight, y + 8, { align: 'right' });

  text('Shipping', labelLeft, y + 15);
  text(shipping === 0 ? 'FREE' : `Rs. ${shipping}`, totalRight, y + 15, { align: 'right' });

  drawLine(labelLeft, y + 20, totalRight, y + 20, pink, 0.5);
  setFont(10, 'bold', pink);
  text('TOTAL', labelLeft, y + 28);
  text(`Rs. ${total.toLocaleString('en-IN')}`, totalRight, y + 28, { align: 'right' });

  if (isPaid) {
    drawRect(margin, y, 40, 10, [232, 255, 245], 2);
    setFont(7, 'bold', green);
    text('PAYMENT RECEIVED', margin + 20, y + 6.5, { align: 'center' });
  }

  // ══════════════════════════════════════════
  //  NOTES & WATERMARK
  // ══════════════════════════════════════════
  y += 40;
  if (y < 240) {
    drawRect(margin, y, 88, 20, light, 2);
    setFont(7, 'bold', pink);
    text('NOTES', margin + 4, y + 6);
    setFont(7, 'normal', gray);
    text('Thank you! For returns, contact within 24 hours.', margin + 4, y + 12);
  }

  if (isPaid) {
    try {
      doc.setTextColor(0, 200, 120); 
      doc.setFontSize(60);
      doc.setFont('helvetica', 'bold');
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.text('PAID', W / 2, 160, { align: 'center', angle: 45 });
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (e) {}
  }

  // ══════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════
  const footerY = 278;
  drawRect(0, footerY, W, 20, pink);
  setFont(8, 'bold', white);
  text('Thank you for your purchase! Shopping with us is always special.', W / 2, footerY + 8, { align: 'center' });
  setFont(6, 'normal', [255, 200, 210]);
  text('Steepray Information Services Pvt. Ltd. | support@ecommerce.com', W / 2, footerY + 14, { align: 'center' });

  doc.save(`Invoice_${order.id}.pdf`);
}