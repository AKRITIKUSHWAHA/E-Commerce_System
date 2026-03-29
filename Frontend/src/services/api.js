const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(method, path, body = null, isFormData = false) {
  const token = localStorage.getItem('sk_token');

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body
      ? isFormData ? body : JSON.stringify(body)
      : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  login:          (body) => request('POST', '/auth/login', body),
  register:       (body) => request('POST', '/auth/register', body),
  getMe:          ()     => request('GET',  '/auth/me'),
  updatePassword: (body) => request('PUT',  '/auth/update-password', body),

  // ── Public Products ───────────────────────────────────
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/products${qs ? '?' + qs : ''}`);
  },
  getProduct:    (id) => request('GET', `/products/${id}`),
  getCategories: ()   => request('GET', '/categories'),

  // ── Reviews ───────────────────────────────────────────
  getReviews:   (productId)       => request('GET',    `/products/${productId}/reviews`),
  addReview:    (productId, body) => request('POST',   `/products/${productId}/reviews`, body),
  deleteReview: (productId)       => request('DELETE', `/products/${productId}/reviews`),

  // ── Seller ────────────────────────────────────────────
  getSellerProducts:  ()         => request('GET',    '/seller/products'),
  createProduct:      (form)     => request('POST',   '/seller/products', form, true),
  updateProduct:      (id, form) => request('PUT',    `/seller/products/${id}`, form, true),
  deleteProduct:      (id)       => request('DELETE', `/seller/products/${id}`),
  getSellerAnalytics: ()         => request('GET',    '/seller/analytics'),
  getSellerOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/seller/orders${qs ? '?' + qs : ''}`);
  },

  // ── Admin ─────────────────────────────────────────────
  getAdminDashboard: () => request('GET', '/admin/dashboard'),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/users${qs ? '?' + qs : ''}`);
  },
  createUser:         (body)       => request('POST',  '/admin/users', body),
  toggleUserActive:   (id)         => request('PUT',   `/admin/users/${id}/toggle`),
  verifySeller:       (id)         => request('PUT',   `/admin/sellers/${id}/verify`),
  getAdminOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/orders${qs ? '?' + qs : ''}`);
  },
  updateOrderStatus:  (id, status) => request('PUT',   `/admin/orders/${id}/status`, { status }),
  toggleStock:        (id)         => request('PATCH', `/admin/products/${id}/toggle-stock`),
  getAdminCategories: ()           => request('GET',   '/admin/categories'),
  createCategory:     (body)       => request('POST',  '/admin/categories', body),
  toggleCategory:     (id)         => request('PUT',   `/admin/categories/${id}/toggle`),
  getPageViews:       ()           => request('GET',   '/admin/page-views'),

  // ── Admin Products ────────────────────────────────────
  getAdminProducts: () => request('GET', '/admin/products'),

  // ── User Orders ───────────────────────────────────────
  getUserOrders:       ()     => request('GET',  '/user/orders'),
  createRazorpayOrder: (body) => request('POST', '/orders/create-razorpay-order', body),
  verifyAndPlaceOrder: (body) => request('POST', '/orders/verify-payment', body),
  placeOrder:          (body) => request('POST', '/orders', body),

  // ── Contact ───────────────────────────────────────────
sendContactMessage:     (body) => request('POST', '/contact', body),
getContactMessages:     ()     => request('GET',  '/admin/contact-messages'),
markMessageRead:        (id)   => request('PUT',  `/admin/contact-messages/${id}/read`),
replyToMessage:         (id, body) => request('PUT', `/admin/contact-messages/${id}/reply`, body),
deleteContactMessage:   (id)   => request('DELETE', `/admin/contact-messages/${id}`),
getMyMessages: (email) => request('GET', `/contact/check?email=${encodeURIComponent(email)}`),

  // ── Page View Tracking ────────────────────────────────
  trackView: (pathname) => {
    try {
      fetch(`${BASE}/track/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname }), // ← fix: path → page
      });
    } catch (e) {}
  },
};