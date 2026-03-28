const { pool }         = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products/:id/reviews
const getReviews = asyncHandler(async (req, res) => {
  const [reviews] = await pool.query(`
    SELECT r.*, u.name AS reviewer_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `, [req.params.id]);

  res.json({ success: true, reviews });
});

// POST /api/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const userId    = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating 1 se 5 ',
    });
  }

  // Check karo pehle se review hai ya nahi
  const [[existing]] = await pool.query(
    'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
    [productId, userId]
  );

  if (existing) {
    // Update karo
    await pool.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE product_id = ? AND user_id = ?',
      [rating, comment || '', productId, userId]
    );
  } else {
    // Naya review add karo
    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)',
      [productId, userId, rating, comment || '']
    );
  }

  res.json({ success: true, message: 'Review submited' });
});

// DELETE /api/products/:id/reviews
const deleteReview = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const userId    = req.user.id;

  await pool.query(
    'DELETE FROM reviews WHERE product_id = ? AND user_id = ?',
    [productId, userId]
  );

  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getReviews, addReview, deleteReview };