const bcrypt = require('bcryptjs');
const { pool }         = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [[totals]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'seller')          AS total_sellers,
      (SELECT COUNT(*) FROM users WHERE role = 'customer')        AS total_customers,
      (SELECT COUNT(*) FROM products WHERE is_active = 1)         AS total_products,
      (SELECT COUNT(*) FROM orders)                               AS total_orders,
      (SELECT COALESCE(SUM(total_amount), 0)
       FROM orders WHERE status != 'cancelled')                   AS total_revenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending')      AS pending_orders,
      (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread') AS unread_messages
  `);

  const [monthly] = await pool.query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      COUNT(*)                          AS orders,
      SUM(total_amount)                 AS revenue
    FROM orders
    WHERE status != 'cancelled'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  const [topSellers] = await pool.query(`
    SELECT
      u.id, u.name, sp.shop_name,
      COUNT(DISTINCT p.id)                    AS products,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue
    FROM users u
    JOIN seller_profiles sp    ON sp.user_id  = u.id
    LEFT JOIN products p       ON p.seller_id = u.id
    LEFT JOIN order_items oi   ON oi.seller_id = u.id
    WHERE u.role = 'seller'
    GROUP BY u.id
    ORDER BY revenue DESC
    LIMIT 5
  `);

  res.json({ success: true, totals, monthly, topSellers });
});

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where    = '';
  const params = [];
  if (role) { where = 'WHERE u.role = ?'; params.push(role); }

  const [users] = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.role, u.is_active, u.created_at,
      sp.shop_name, sp.is_verified,
      (SELECT COUNT(*) FROM products WHERE seller_id = u.id) AS product_count
    FROM users u
    LEFT JOIN seller_profiles sp ON sp.user_id = u.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  res.json({ success: true, users });
});

// PUT /api/admin/users/:id/toggle
const toggleUserActive = asyncHandler(async (req, res) => {
  const [[user]] = await pool.query(
    'SELECT id, is_active FROM users WHERE id = ?', [req.params.id]
  );
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  await pool.query(
    'UPDATE users SET is_active = ? WHERE id = ?',
    [!user.is_active, user.id]
  );
  res.json({
    success: true,
    message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
  });
});

// PUT /api/admin/sellers/:id/verify
const verifySeller = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE seller_profiles SET is_verified = TRUE WHERE user_id = ?',
    [req.params.id]
  );
  res.json({ success: true, message: 'Seller verified successfully' });
});

// POST /api/admin/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, shop_name, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const [[exists]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists) {
    return res.status(409).json({ success: false, message: 'This email already exists' });
  }

  const hashed   = await bcrypt.hash(password || 'password123', 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
    [name, email, hashed, role || 'seller']
  );

  if (role === 'seller' && shop_name) {
    await pool.query(
      'INSERT INTO seller_profiles (user_id, shop_name, phone) VALUES (?,?,?)',
      [result.insertId, shop_name, phone || null]
    );
  }

  res.status(201).json({ success: true, message: 'User created successfully', userId: result.insertId });
});

// GET /api/categories — public (active only)
const getCategories = asyncHandler(async (req, res) => {
  const [cats] = await pool.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY name');
  res.json({ success: true, categories: cats });
});

// GET /api/admin/categories — admin (all)
const getAllCategories = asyncHandler(async (req, res) => {
  const [cats] = await pool.query('SELECT * FROM categories ORDER BY name');
  res.json({ success: true, categories: cats });
});

// POST /api/admin/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, emoji } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  await pool.query(
    'INSERT INTO categories (name, slug, emoji) VALUES (?,?,?)',
    [name, slug, emoji || '🛍️']
  );
  res.status(201).json({ success: true, message: 'Category created successfully' });
});

// PUT /api/admin/categories/:id/toggle
const toggleCategory = asyncHandler(async (req, res) => {
  const [[cat]] = await pool.query(
    'SELECT id, is_active FROM categories WHERE id = ?', [req.params.id]
  );
  if (!cat) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  await pool.query(
    'UPDATE categories SET is_active = ? WHERE id = ?',
    [cat.is_active ? 0 : 1, req.params.id]
  );
  res.json({
    success: true,
    is_active: !cat.is_active,
    message: `Category ${!cat.is_active ? 'activated' : 'deactivated'} successfully`,
  });
});

// POST /api/track/view — public
const trackView = asyncHandler(async (req, res) => {
  const { path, page } = req.body;
  const pagePath = path || page || '/';
  const ip       = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const user_id  = req.user?.id || null;

  await pool.query(
    'INSERT INTO page_views (page, ip, user_id) VALUES (?,?,?)',
    [pagePath, ip, user_id]
  );
  res.json({ success: true });
});

// GET /api/admin/page-views
const getPageViews = asyncHandler(async (req, res) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM page_views');

  const [[{ today }]] = await pool.query(
    'SELECT COUNT(*) AS today FROM page_views WHERE DATE(created_at) = CURDATE()'
  );

  const [topPages] = await pool.query(`
    SELECT page, COUNT(*) AS views
    FROM page_views
    GROUP BY page
    ORDER BY views DESC
    LIMIT 10
  `);

  const [daily] = await pool.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS views
    FROM page_views
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY date
    ORDER BY date ASC
  `);

  res.json({ success: true, total, today, topPages, daily });
});

// ══════════════════════════════════════════
//  CONTACT MESSAGES
// ══════════════════════════════════════════

// POST /api/contact — public (user message bhejega)
const sendContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email aur message required hain',
    });
  }

  await pool.query(
    `INSERT INTO contact_messages (name, email, phone, subject, message)
     VALUES (?,?,?,?,?)`,
    [name, email, phone || null, subject || null, message]
  );

  res.status(201).json({
    success: true,
    message: 'Message sent successfully! We will reply within 24 hours.',
  });
});

// GET /api/admin/contact-messages — admin
const getContactMessages = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let where    = '';
  const params = [];
  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  const [messages] = await pool.query(
    `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC`,
    params
  );

  const [[{ unread }]] = await pool.query(
    `SELECT COUNT(*) AS unread FROM contact_messages WHERE status = 'unread'`
  );

  res.json({ success: true, messages, unread });
});

// PUT /api/admin/contact-messages/:id/read — mark as read
const markMessageRead = asyncHandler(async (req, res) => {
  await pool.query(
    `UPDATE contact_messages SET status = 'read' WHERE id = ?`,
    [req.params.id]
  );
  res.json({ success: true, message: 'Marked as read' });
});

// PUT /api/admin/contact-messages/:id/reply — reply bhejo
const replyToMessage = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) {
    return res.status(400).json({ success: false, message: 'Reply text required' });
  }

  await pool.query(
    `UPDATE contact_messages SET reply = ?, status = 'replied' WHERE id = ?`,
    [reply, req.params.id]
  );

  res.json({ success: true, message: 'Reply saved successfully!' });
});

// DELETE /api/admin/contact-messages/:id
const deleteContactMessage = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Message deleted' });
});

// GET /api/contact/check?email=xxx — public (user apna reply check kare)
const getMyMessages = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }
  const [messages] = await pool.query(
    `SELECT id, name, subject, message, reply, status, created_at
     FROM contact_messages WHERE email = ? ORDER BY created_at DESC`,
    [email]
  );
  res.json({ success: true, messages });
});

module.exports = {
  getDashboard,
  getUsers,
  toggleUserActive,
  verifySeller,
  createUser,
  getCategories,
  getAllCategories,
  createCategory,
  toggleCategory,
  trackView,
  getPageViews,
  sendContactMessage,
  getContactMessages,
  markMessageRead,
  replyToMessage,
  deleteContactMessage,
  getMyMessages,
};