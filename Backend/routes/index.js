const express = require('express');
const router  = express.Router();

const { protect, adminOnly, sellerOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const { register, login, getMe, updatePassword } = require('../controllers/authController');

const {
  getProducts, getProduct,
  getSellerProducts, createProduct, updateProduct, deleteProduct,
  getSellerAnalytics, toggleStock,
} = require('../controllers/productController');

const {
  createRazorpayOrder, verifyAndPlaceOrder, placeOrder,
  getUserOrders, getSellerOrders, updateOrderStatus, getAllOrders,
} = require('../controllers/orderController');

const {
  getDashboard, getUsers, toggleUserActive, verifySeller,
  createUser, getCategories, getAllCategories, createCategory,
  toggleCategory, trackView, getPageViews,
  sendContactMessage, getContactMessages, markMessageRead,
  replyToMessage, deleteContactMessage,
} = require('../controllers/adminController');

const {
  getReviews, addReview, deleteReview,
} = require('../controllers/reviewController');

// ══════════════════════════════════════════
//  AUTH ROUTES
// ══════════════════════════════════════════
router.post('/auth/register',       register);
router.post('/auth/login',          login);
router.get ('/auth/me',             protect, getMe);
router.put ('/auth/update-password',protect, updatePassword);

// ══════════════════════════════════════════
//  PUBLIC PRODUCT ROUTES
// ══════════════════════════════════════════
router.get('/products',     getProducts);
router.get('/products/:id', getProduct);
router.get('/categories',   getCategories);

// ══════════════════════════════════════════
//  REVIEW ROUTES
// ══════════════════════════════════════════
router.get   ('/products/:id/reviews', getReviews);
router.post  ('/products/:id/reviews', protect, addReview);
router.delete('/products/:id/reviews', protect, deleteReview);

// ══════════════════════════════════════════
//  CONTACT ROUTES
// ══════════════════════════════════════════
router.post('/contact', sendContactMessage); // public

// ══════════════════════════════════════════
//  SELLER ROUTES
// ══════════════════════════════════════════
router.get   ('/seller/products',          protect, sellerOnly, getSellerProducts);
router.post  ('/seller/products',          protect, sellerOnly, upload.array('images', 5), createProduct);
router.put   ('/seller/products/:id',      protect, sellerOnly, upload.array('images', 5), updateProduct);
router.delete('/seller/products/:id',      protect, sellerOnly, deleteProduct);
router.get   ('/seller/analytics',         protect, sellerOnly, getSellerAnalytics);
router.get   ('/seller/orders',            protect, sellerOnly, getSellerOrders);
router.put   ('/seller/orders/:id/status', protect, sellerOnly, updateOrderStatus);

// ══════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════
router.get  ('/admin/dashboard',               protect, adminOnly, getDashboard);
router.get  ('/admin/users',                   protect, adminOnly, getUsers);
router.post ('/admin/users',                   protect, adminOnly, createUser);
router.put  ('/admin/users/:id/toggle',        protect, adminOnly, toggleUserActive);
router.put  ('/admin/sellers/:id/verify',      protect, adminOnly, verifySeller);
router.get  ('/admin/orders',                  protect, adminOnly, getAllOrders);
router.put  ('/admin/orders/:id/status',       protect, adminOnly, updateOrderStatus);
router.post ('/admin/categories',              protect, adminOnly, createCategory);
router.get  ('/admin/categories',              protect, adminOnly, getAllCategories);
router.put  ('/admin/categories/:id/toggle',   protect, adminOnly, toggleCategory);
router.patch('/admin/products/:id/toggle-stock', protect, adminOnly, toggleStock);
router.get  ('/admin/page-views',              protect, adminOnly, getPageViews);

// ── Contact Messages (Admin) ──
router.get   ('/admin/contact-messages',          protect, adminOnly, getContactMessages);
router.put   ('/admin/contact-messages/:id/read', protect, adminOnly, markMessageRead);
router.put   ('/admin/contact-messages/:id/reply',protect, adminOnly, replyToMessage);
router.delete('/admin/contact-messages/:id',      protect, adminOnly, deleteContactMessage);

// ── Public track route ──
router.post('/track/view', trackView);

// ══════════════════════════════════════════
//  ORDER ROUTES
// ══════════════════════════════════════════
router.post('/orders/create-razorpay-order', protect, createRazorpayOrder);
router.post('/orders/verify-payment',        protect, verifyAndPlaceOrder);
router.post('/orders',                       protect, placeOrder);
router.get ('/user/orders',                  protect, getUserOrders);

module.exports = router;