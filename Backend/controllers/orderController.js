const { pool }         = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const Razorpay         = require('razorpay');
const crypto           = require('crypto');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────
// POST /api/orders/create-razorpay-order
// ─────────────────────────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  if (!amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  const order = await razorpay.orders.create({
    amount:   Math.round(amount * 100),
    currency,
    receipt:  receipt || `receipt_${Date.now()}`,
  });

  res.json({
    success:  true,
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    key:      process.env.RAZORPAY_KEY_ID,
  });
});

// ─────────────────────────────────────────
// POST /api/orders/verify-payment
// ─────────────────────────────────────────
const verifyAndPlaceOrder = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    customer_name, customer_email, customer_phone,
    address, items,
  } = req.body;

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  if (!customer_name || !customer_email || !address || !items?.length) {
    return res.status(400).json({ success: false, message: 'Order details incomplete' });
  }

  let total = 0;
  const enriched = [];

  for (const item of items) {
    const [[product]] = await pool.query(
      'SELECT id, name, price, stock, seller_id FROM products WHERE id = ? AND is_active = 1',
      [item.product_id]
    );
    if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.product_id}` });
    if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
    total += product.price * item.quantity;
    enriched.push({ ...item, product, price: product.price });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderRes] = await conn.query(`
      INSERT INTO orders
        (customer_id, customer_name, customer_email, customer_phone,
         address, total_amount, payment_method, payment_status, status, notes)
      VALUES (?,?,?,?,?,?,'Razorpay','paid','confirmed',?)
    `, [
      req.user?.id || null,
      customer_name, customer_email, customer_phone || null,
      address, total,
      `Razorpay Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}`,
    ]);

    const orderId = orderRes.insertId;

    for (const item of enriched) {
      await conn.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, product_name, price, quantity, size, color)
        VALUES (?,?,?,?,?,?,?,?)
      `, [orderId, item.product.id, item.product.seller_id, item.product.name, item.price, item.quantity, item.size || null, item.color || null]);

      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product.id]);
    }

    await conn.commit();
    res.status(201).json({ success: true, orderId, total, paymentId: razorpay_payment_id, message: 'Order placed successfully!' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────
// GET /api/user/orders
// ─────────────────────────────────────────
const getUserOrders = asyncHandler(async (req, res) => {
  const [orders] = await pool.query(`
    SELECT o.id, o.customer_name, o.customer_email, o.customer_phone,
           o.address, o.total_amount, o.status, o.payment_method,
           o.payment_status, o.notes, o.created_at
    FROM orders o WHERE o.customer_id = ?
    ORDER BY o.created_at DESC
  `, [req.user.id]);

  for (const order of orders) {
    const [items] = await pool.query(`
      SELECT oi.*, p.images AS product_images
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `, [order.id]);

    order.items = items.map(item => {
      let image = '';
      try {
        const raw = item.product_images;
        const imgs = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
        image = imgs[0] || '';
      } catch (e) {
        image = '';
      }
      const { product_images, ...rest } = item;
      return { ...rest, image };
    });
  }
  res.json({ success: true, orders });
});

// ─────────────────────────────────────────
// POST /api/orders (legacy)
// ─────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const { customer_name, customer_email, customer_phone, address, items, payment_method = 'COD', notes } = req.body;

  if (!customer_name || !customer_email || !address || !items?.length) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  let total = 0;
  const enriched = [];

  for (const item of items) {
    const [[product]] = await pool.query('SELECT id, name, price, stock, seller_id FROM products WHERE id = ? AND is_active = 1', [item.product_id]);
    if (!product) return res.status(400).json({ success: false, message: `Product not found` });
    if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `${product.name} is out of stock` });
    total += product.price * item.quantity;
    enriched.push({ ...item, product, price: product.price });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [orderRes] = await conn.query(`
      INSERT INTO orders (customer_id, customer_name, customer_email, customer_phone, address, total_amount, payment_method, notes)
      VALUES (?,?,?,?,?,?,?,?)
    `, [req.user?.id || null, customer_name, customer_email, customer_phone || null, address, total, payment_method, notes || null]);

    const orderId = orderRes.insertId;
    for (const item of enriched) {
      await conn.query(`INSERT INTO order_items (order_id, product_id, seller_id, product_name, price, quantity, size, color) VALUES (?,?,?,?,?,?,?,?)`,
        [orderId, item.product.id, item.product.seller_id, item.product.name, item.price, item.quantity, item.size || null, item.color || null]);
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product.id]);
    }
    await conn.commit();
    res.status(201).json({ success: true, orderId, total, message: 'Order placed successfully!' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────
// GET /api/seller/orders
// ─────────────────────────────────────────
const getSellerOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const sellerId = req.user.id;
  let where = 'WHERE oi.seller_id = ?';
  const params = [sellerId];
  if (status) { where += ' AND o.status = ?'; params.push(status); }

  const [orders] = await pool.query(`
    SELECT DISTINCT o.id, o.customer_name, o.customer_email, o.customer_phone,
      o.address, o.total_amount, o.status, o.payment_method, o.payment_status, o.created_at,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id AND seller_id = ?) AS item_count
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
    ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `, [sellerId, ...params, Number(limit), offset]);

  for (const order of orders) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? AND seller_id = ?', [order.id, sellerId]);
    order.items = items;
  }
  res.json({ success: true, orders, page: Number(page), limit: Number(limit) });
});

// ─────────────────────────────────────────
// PUT /api/seller/orders/:id/status
// ─────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });

  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (req.user.role === 'seller') {
    const [[hasItem]] = await pool.query('SELECT id FROM order_items WHERE order_id = ? AND seller_id = ?', [order.id, req.user.id]);
    if (!hasItem) return res.status(403).json({ success: false, message: 'This is not your order' });
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
  res.json({ success: true, message: `Order status updated to "${status}"` });
});

// ─────────────────────────────────────────
// GET /api/admin/orders
// ─────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  let where = '';
  const params = [];
  if (status) { where = 'WHERE o.status = ?'; params.push(status); }

  const [orders] = await pool.query(`
    SELECT o.*, COUNT(oi.id) AS item_count
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    ${where} GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  // Har order ke items + product image fetch karo
  for (const order of orders) {
    const [items] = await pool.query(`
      SELECT oi.*, p.images AS product_images
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `, [order.id]);

    order.items = items.map(item => {
      let image = '';
      try {
        const raw  = item.product_images;
        const imgs = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
        image = imgs[0] || '';
      } catch { image = ''; }
      const { product_images, ...rest } = item;
      return { ...rest, image };
    });
  }

  res.json({ success: true, orders });
});

module.exports = { createRazorpayOrder, verifyAndPlaceOrder, placeOrder, getUserOrders, getSellerOrders, updateOrderStatus, getAllOrders };