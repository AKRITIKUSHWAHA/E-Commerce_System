const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool }         = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const signToken = (id, role) =>
  jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'customer', shop_name, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email aur password required hai',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password minimum 6 characters ka hona chahiye',
    });
  }

  // Sirf customer ya seller self-register kar sakta hai
  const userRole = ['customer', 'seller'].includes(role) ? role : 'customer';

  const [[exists]] = await pool.query(
    'SELECT id FROM users WHERE email = ?', [email]
  );
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Ye email already registered hai',
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
    [name, email, hashed, userRole]
  );
  const userId = result.insertId;

  if (userRole === 'seller') {
    if (!shop_name) {
      return res.status(400).json({
        success: false,
        message: 'Seller ke liye shop name required hai',
      });
    }
    await pool.query(
      'INSERT INTO seller_profiles (user_id, shop_name, phone) VALUES (?,?,?)',
      [userId, shop_name, phone || null]
    );
  }

  const token = signToken(userId, userRole);
  res.status(201).json({
    success: true,
    token,
    user: { id: userId, name, email, role: userRole },
  });
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email aur password dono chahiye',
    });
  }

  const [[user]] = await pool.query(
    'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Aapka account deactivated hai. Admin se contact karein.',
    });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  let sellerProfile = null;
  if (user.role === 'seller') {
    const [[sp]] = await pool.query(
      'SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]
    );
    sellerProfile = sp || null;
  }

  const token = signToken(user.id, user.role);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sellerProfile,
    },
  });
});

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const [[user]] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  let sellerProfile = null;
  if (user.role === 'seller') {
    const [[sp]] = await pool.query(
      'SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]
    );
    sellerProfile = sp || null;
  }

  res.json({ success: true, user: { ...user, sellerProfile } });
});

// ─────────────────────────────────────────
// PUT /api/auth/update-password
// ─────────────────────────────────────────
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const [[user]] = await pool.query(
    'SELECT password FROM users WHERE id = ?', [req.user.id]
  );

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password galat hai',
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password minimum 6 characters ka hona chahiye',
    });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

  res.json({ success: true, message: 'Password update ho gaya' });
});

module.exports = { register, login, getMe, updatePassword };