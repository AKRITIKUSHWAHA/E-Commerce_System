const { pool }         = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const tryParse = (val, fallback) => {
  try {
    return typeof val === 'string' ? JSON.parse(val) : (val || fallback);
  } catch {
    return fallback;
  }
};

const parseProduct = (p) => ({
  ...p,
  sizes:  tryParse(p.sizes,  []),
  colors: tryParse(p.colors, []),
  images: tryParse(p.images, []),
  tags:   tryParse(p.tags,   []),
});

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, sort, min_price, max_price, rating, in_stock, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  let where  = ['p.is_active = 1'];
  const params = [];

  if (category)  { where.push('c.slug = ?');                        params.push(category); }
  if (search)    { where.push('(p.name LIKE ? OR p.brand LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (min_price) { where.push('p.price >= ?');                       params.push(min_price); }
  if (max_price) { where.push('p.price <= ?');                       params.push(max_price); }
  if (in_stock === 'true') { where.push('p.stock > 0'); }

  const orderMap = {
    'price-asc':  'p.price ASC',
    'price-desc': 'p.price DESC',
    'rating':     'avg_rating DESC',
    'discount':   '((p.original_price - p.price) / p.original_price) DESC',
    'newest':     'p.created_at DESC',
  };
  const orderBy  = orderMap[sort] || 'p.created_at DESC';
  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
      u.name AS seller_name, sp.shop_name,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS rating_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.seller_id = u.id
    LEFT JOIN seller_profiles sp ON sp.user_id = u.id
    LEFT JOIN reviews r ON r.product_id = p.id
    ${whereStr}
    GROUP BY p.id
    ${rating ? `HAVING avg_rating >= ${parseFloat(rating)}` : ''}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(DISTINCT p.id) AS total FROM products p
     JOIN categories c ON p.category_id = c.id ${whereStr}`, params
  );

  res.json({ success: true, total, page: Number(page), limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)), products: rows.map(parseProduct) });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const [[product]] = await pool.query(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug,
      u.name AS seller_name, sp.shop_name,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS rating_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.seller_id = u.id
    LEFT JOIN seller_profiles sp ON sp.user_id = u.id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE p.id = ? AND p.is_active = 1
    GROUP BY p.id
  `, [req.params.id]);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const [reviews] = await pool.query(
    'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 10', [product.id]
  );

  res.json({ success: true, product: parseProduct(product), reviews });
});

// GET /api/seller/products
const getSellerProducts = asyncHandler(async (req, res) => {
  const sellerId = req.user.role === 'admin' ? (req.query.seller_id || null) : req.user.id;
  const where  = sellerId ? 'WHERE p.seller_id = ?' : '';
  const params = sellerId ? [sellerId] : [];

  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name,
      COALESCE(AVG(r.rating), 0) AS avg_rating,
      COUNT(DISTINCT r.id) AS rating_count,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS total_sold
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON r.product_id = p.id
    ${where}
    GROUP BY p.id ORDER BY p.created_at DESC
  `, params);

  res.json({ success: true, products: rows.map(parseProduct) });
});

// POST /api/seller/products
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, brand, price, original_price, stock, category_id, sizes, colors, tags } = req.body;

  if (!name || !price || !original_price || !category_id) {
    return res.status(400).json({ success: false, message: 'name, price, original_price, and category_id are required' });
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map(f => `/uploads/${f.filename}`);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  const [result] = await pool.query(`
    INSERT INTO products (seller_id, category_id, name, description, brand, price, original_price, stock, sizes, colors, images, tags)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    req.user.id, category_id, name, description || '', brand || '',
    price, original_price, stock || 0,
    JSON.stringify(toArray(sizes)), JSON.stringify(toArray(colors)),
    JSON.stringify(images), JSON.stringify(toArray(tags)),
  ]);

  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, product: parseProduct(product) });
});

// PUT /api/seller/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'This is not your product' });
  }

  const { name, description, brand, price, original_price, stock, category_id, sizes, colors, tags, is_active } = req.body;

  // ── Stock: jo admin daale woh existing mein ADD karo ──
  const stockVal = (stock !== undefined && stock !== '' && stock !== null)
    ? Number(product.stock) + Number(stock)
    : Number(product.stock);

  let images = tryParse(product.images, []);
  if (req.files && req.files.length > 0) {
    images = req.files.map(f => `/uploads/${f.filename}`);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  // ── FIX: is_active string 'true'/'false' ko number mein convert karo ──
  let isActiveVal = product.is_active;
  if (is_active !== undefined && is_active !== null && is_active !== '') {
    isActiveVal = (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1') ? 1 : 0;
  }

  await pool.query(`
    UPDATE products SET
      name = ?, description = ?, brand = ?, price = ?,
      original_price = ?, stock = ?, category_id = ?,
      sizes = ?, colors = ?, images = ?, tags = ?, is_active = ?
    WHERE id = ?
  `, [
    name           || product.name,
    description    ?? product.description,
    brand          ?? product.brand,
    price          || product.price,
    original_price || product.original_price,
    stockVal,
    category_id    || product.category_id,
    JSON.stringify(Array.isArray(sizes)  ? sizes  : tryParse(product.sizes,  [])),
    JSON.stringify(Array.isArray(colors) ? colors : tryParse(product.colors, [])),
    JSON.stringify(images),
    JSON.stringify(Array.isArray(tags)   ? tags   : tryParse(product.tags,   [])),
    isActiveVal,
    id,
  ]);

  const [[updated]] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  res.json({ success: true, product: parseProduct(updated) });
});

// DELETE /api/seller/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const [[product]] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'This is not your product' });
  }

  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// GET /api/seller/analytics
const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;

  const [[stats]] = await pool.query(`
    SELECT COUNT(DISTINCT p.id) AS total_products,
      COALESCE(SUM(oi.price * oi.quantity), 0) AS total_revenue,
      COUNT(DISTINCT oi.order_id) AS total_orders,
      COALESCE(SUM(oi.quantity), 0) AS total_units_sold
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
    WHERE p.seller_id = ?
  `, [sellerId]);

  const [monthly] = await pool.query(`
    SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month,
      SUM(oi.price * oi.quantity) AS revenue, COUNT(DISTINCT o.id) AS orders
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ? AND o.status != 'cancelled'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month ORDER BY month ASC
  `, [sellerId]);

  const [topProducts] = await pool.query(`
    SELECT p.id, p.name, p.price, p.images,
      SUM(oi.quantity) AS units_sold, SUM(oi.price * oi.quantity) AS revenue
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    WHERE oi.seller_id = ?
    GROUP BY p.id ORDER BY units_sold DESC LIMIT 5
  `, [sellerId]);

  const [statusBreakdown] = await pool.query(`
    SELECT o.status, COUNT(DISTINCT o.id) AS count
    FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.seller_id = ? GROUP BY o.status
  `, [sellerId]);

  res.json({
    success: true, stats, monthly,
    topProducts: topProducts.map(p => ({ ...p, images: tryParse(p.images, []) })),
    statusBreakdown,
  });
});

// PATCH /api/admin/products/:id/toggle-stock
const toggleStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [[product]] = await pool.query('SELECT id, stock FROM products WHERE id = ?', [id]);

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const newStock = product.stock > 0 ? 0 : 10;
  await pool.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, id]);

  res.json({
    success: true,
    message: newStock === 0 ? 'Product marked as Out of Stock' : 'Product marked as In Stock',
    stock: newStock,
  });
});

module.exports = { getProducts, getProduct, getSellerProducts, createProduct, updateProduct, deleteProduct, getSellerAnalytics, toggleStock };