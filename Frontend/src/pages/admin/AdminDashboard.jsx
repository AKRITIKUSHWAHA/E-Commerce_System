import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Footer from '../../components/Footer/Footer';
import './AdminDashboard.css';

// ══════════════════════════════════════════
//  BADGE COMPONENT
// ══════════════════════════════════════════
const Badge = ({ status }) => {
  const map = {
    pending:   'badge-warn',
    confirmed: 'badge-info',
    shipped:   'badge-info',
    delivered: 'badge-succ',
    cancelled: 'badge-err',
    active:    'badge-succ',
    inactive:  'badge-err',
    true:      'badge-succ',
    false:     'badge-err',
  };
  return (
    <span className={`adm-badge ${map[String(status)] || 'badge-info'}`}>
      {String(status)}
    </span>
  );
};

const getImgUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `http://localhost:5000${img}`;
};

// ══════════════════════════════════════════
//  PRODUCT MODAL
// ══════════════════════════════════════════
function ProductModal({ product, categories, adminId, onClose, onSaved }) {
  const isEdit = !!product;
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [previews,      setPreviews]      = useState(product?.images || []);
  const [imgMode,       setImgMode]       = useState('url');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [hasDisclaimer, setHasDisclaimer] = useState(
    product?.has_disclaimer === 1 || false
  );

  const [form, setForm] = useState({
    name:           product?.name              || '',
    description:    product?.description       || '',
    brand:          product?.brand             || '',
    price:          product?.price             || '',
    original_price: product?.original_price    || '',
    stock:          product?.stock             || '',
    category_id:    product?.category_id       || '',
    sizes:          product?.sizes?.join(',')  || '',
    colors:         product?.colors?.join(',') || '',
    tags:           product?.tags?.join(',')   || '',
    is_active:      product?.is_active !== false,
    image_urls:     product?.images?.join('\n') || '',
  });

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('seller_id', adminId);
      fd.append('has_disclaimer', hasDisclaimer ? '1' : '0');
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'image_urls') fd.append(k, v);
      });

      if (imgMode === 'file' && uploadedFiles.length > 0) {
        uploadedFiles.forEach(f => fd.append('images', f));
      } else if (imgMode === 'url') {
        const urls = form.image_urls.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5);
        urls.forEach(u => fd.append('images', u));
      }

      isEdit ? await api.updateProduct(product.id, fd) : await api.createProduct(fd);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-pform" onSubmit={submit}>
          <div className="adm-pform-grid">
            <div className="apf apf-full">
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="e.g. Floral Maxi Dress" required />
            </div>
            <div className="apf">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handle} placeholder="e.g. StyleCo" />
            </div>
            <div className="apf">
              <label>Category *</label>
              <select name="category_id" value={form.category_id} onChange={handle} required>
                <option value="">-- Select --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="apf">
              <label>Selling Price (₹) *</label>
              <input name="price" type="number" min="1" value={form.price} onChange={handle}
                placeholder="799" required onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>MRP / Original Price (₹) *</label>
              <input name="original_price" type="number" min="1" value={form.original_price}
                onChange={handle} placeholder="1999" required onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>Add Stock <small>(will be added to existing)</small></label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handle}
                placeholder="e.g. 10 (adds to current)" onWheel={e => e.target.blur()} />
            </div>
            <div className="apf">
              <label>Sizes <small>(comma separated)</small></label>
              <input name="sizes" value={form.sizes} onChange={handle} placeholder="S, M, L, XL" />
            </div>
            <div className="apf">
              <label>Colors <small>(comma separated)</small></label>
              <input name="colors" value={form.colors} onChange={handle} placeholder="#FF0000, #00FF00" />
            </div>
            <div className="apf">
              <label>Tags <small>(comma separated)</small></label>
              <input name="tags" value={form.tags} onChange={handle} placeholder="Trending, New, Sale" />
            </div>
            <div className="apf apf-check">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} />
                Active (It will be visible on the store.)
              </label>
            </div>
            <div className="apf apf-full">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handle}
                rows={3} placeholder="Product description..." />
            </div>

            {/* ── Disclaimer Toggle ── */}
            <div className="apf apf-full">
              <label className="adm-disclaimer-toggle">
                <input type="checkbox" checked={hasDisclaimer}
                  onChange={e => setHasDisclaimer(e.target.checked)} />
                <div className="adm-disclaimer-toggle__content">
                  <span className="adm-disclaimer-toggle__title">
                    ⚠️ Add <strong>Non-Returnable</strong> disclaimer to this product
                  </span>
                  <span className="adm-disclaimer-toggle__sub">
                    Customers will see a return policy notice at checkout
                  </span>
                </div>
                <span className={`adm-disclaimer-pill ${hasDisclaimer ? 'on' : 'off'}`}>
                  {hasDisclaimer ? '✓ Added' : '+ Add'}
                </span>
              </label>
              {hasDisclaimer && (
                <div className="adm-disclaimer-box">
                  <div className="adm-disclaimer-header">
                    <span>⚠️</span>
                    <strong>Return Policy Notice — Customers will see this at checkout</strong>
                  </div>
                  <ul className="adm-disclaimer-list">
                    <li>🚫 This product is <strong>non-returnable</strong> once delivered.</li>
                    <li>📦 Please check the product carefully before accepting delivery.</li>
                    <li>❌ No refund or exchange will be provided after delivery.</li>
                    <li>✅ Only damaged/wrong item complaints accepted within 24 hours.</li>
                  </ul>
                  <p className="adm-disclaimer-note">
                    ℹ️ This disclaimer will be shown to customers at checkout.
                  </p>
                </div>
              )}
            </div>

            <div className="apf apf-full">
              <label>Product Images <small>(max 5)</small></label>
              <div className="adm-img-mode-tabs">
                <button type="button" className={imgMode === 'url' ? 'active' : ''}
                  onClick={() => {
                    setImgMode('url'); setUploadedFiles([]);
                    setPreviews(form.image_urls.split('\n').map(u => u.trim()).filter(Boolean));
                  }}>
                  🔗 Image URL
                </button>
                <button type="button" className={imgMode === 'file' ? 'active' : ''}
                  onClick={() => { setImgMode('file'); setPreviews([]); }}>
                  📷 Upload Photos
                </button>
              </div>
              {imgMode === 'url' && (
                <textarea name="image_urls" value={form.image_urls}
                  onChange={(e) => {
                    handle(e);
                    setPreviews(e.target.value.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5));
                  }}
                  rows={4} placeholder={"Every line should have an image URL (max 5):\nhttps://example.com/image1.jpg"} />
              )}
              {imgMode === 'file' && (
                <div className="adm-upload-zone">
                  <input type="file" multiple accept="image/*" id="img-file-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files).slice(0, 5);
                      setUploadedFiles(files);
                      setPreviews(files.map(f => URL.createObjectURL(f)));
                    }}
                  />
                  <label htmlFor="img-file-upload" className="adm-upload-zone__label">
                    <span className="adm-upload-zone__icon">📷</span>
                    <p>Click here to choose photos</p>
                    <small>JPG, PNG, WEBP • Max 5MB each • Max 5 photos • Hold Ctrl to select multiple</small>
                  </label>
                </div>
              )}
              {previews.length > 0 && (
                <div className="adm-img-previews">
                  {previews.slice(0, 5).map((src, i) => (
                    <div key={i} className="adm-img-preview">
                      <img src={src} alt="" onError={e => e.target.style.display = 'none'} />
                      <button type="button" className="adm-img-remove"
                        onClick={() => {
                          if (imgMode === 'url') {
                            const lines = form.image_urls.split('\n').filter((_, idx) => idx !== i).join('\n');
                            setForm(f => ({ ...f, image_urls: lines }));
                          }
                          setPreviews(p => p.filter((_, idx) => idx !== i));
                          setUploadedFiles(f => f.filter((_, idx) => idx !== i));
                        }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="adm-form-error">⚠️ {error}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn-save" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '✅ Update Product' : '✅ Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  AD MODAL
// ══════════════════════════════════════════
function AdModal({ ad, onClose, onSaved }) {
  const isEdit = !!ad;
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    title:       ad?.title       || '',
    description: ad?.description || '',
    image_url:   ad?.image_url   || '',
    link_url:    ad?.link_url    || '',
    type:        ad?.type        || 'banner',
    position:    ad?.position    || 'home_top',
    bg_color:    ad?.bg_color    || '#FF3E6C',
    text_color:  ad?.text_color  || '#ffffff',
    is_active:   ad?.is_active !== false && ad?.is_active !== 0,
    start_date:  ad?.start_date  || '',
    end_date:    ad?.end_date    || '',
  });

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      isEdit ? await api.updateAd(ad.id, form) : await api.createAd(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2>{isEdit ? '✏️ Edit Ad' : '➕ Create New Ad'}</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-pform" onSubmit={submit}>
          <div className="adm-pform-grid">
            <div className="apf apf-full">
              <label>Ad Title</label>
              <input name="title" value={form.title} onChange={handle}
                placeholder="e.g. 🎉 Grand Sale — Up to 70% Off!" />
            </div>
            <div className="apf apf-full">
              <label>Description / Message</label>
              <textarea name="description" value={form.description} onChange={handle}
                rows={2} placeholder="Short description shown in the ad" />
            </div>
            <div className="apf apf-full">
              <label>Image URL <small>(optional)</small></label>
              <input name="image_url" value={form.image_url} onChange={handle}
                placeholder="https://example.com/ad-image.jpg" />
              {form.image_url && (
                <img src={form.image_url} alt="preview"
                  style={{ marginTop: 8, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  onError={e => e.target.style.display='none'} />
              )}
            </div>
            <div className="apf apf-full">
              <label>Click Link URL <small>(optional)</small></label>
              <input name="link_url" value={form.link_url} onChange={handle}
                placeholder="https://yoursite.com/sale or /home?cat=women" />
            </div>
            <div className="apf">
              <label>Ad Type</label>
              <select name="type" value={form.type} onChange={handle}>
                <option value="banner">🖼️ Banner (Top/Bottom strip)</option>
                <option value="text">📝 Text (Thin announcement bar)</option>
                <option value="popup">🎯 Popup (Shows on page load)</option>
              </select>
            </div>
            <div className="apf">
              <label>Position</label>
              <select name="position" value={form.position} onChange={handle}>
                <option value="home_top">🏠 Home Top</option>
                <option value="home_middle">📍 Home Middle</option>
                <option value="home_bottom">⬇️ Home Bottom</option>
                <option value="all_pages">🌐 All Pages</option>
              </select>
            </div>
            <div className="apf">
              <label>Background Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" name="bg_color" value={form.bg_color} onChange={handle}
                  style={{ width: 48, height: 40, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
                <input name="bg_color" value={form.bg_color} onChange={handle}
                  placeholder="#FF3E6C" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="apf">
              <label>Text Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" name="text_color" value={form.text_color} onChange={handle}
                  style={{ width: 48, height: 40, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
                <input name="text_color" value={form.text_color} onChange={handle}
                  placeholder="#ffffff" style={{ flex: 1 }} />
              </div>
            </div>
            <div className="apf">
              <label>Start Date <small>(optional)</small></label>
              <input type="date" name="start_date" value={form.start_date} onChange={handle} />
            </div>
            <div className="apf">
              <label>End Date <small>(optional)</small></label>
              <input type="date" name="end_date" value={form.end_date} onChange={handle} />
            </div>
            <div className="apf apf-check">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} />
                Active (Ad will be shown to users)
              </label>
            </div>
            <div className="apf apf-full">
              <label>Live Preview</label>
              <div className="adm-ad-live-preview"
                style={{ background: form.bg_color, color: form.text_color }}>
                {form.image_url && (
                  <img src={form.image_url} alt="preview"
                    style={{ height: 50, objectFit: 'contain', borderRadius: 6, marginRight: 12 }}
                    onError={e => e.target.style.display='none'} />
                )}
                <div>
                  {form.title && <strong style={{ display: 'block', fontSize: 14 }}>{form.title}</strong>}
                  {form.description && <span style={{ fontSize: 12, opacity: 0.9 }}>{form.description}</span>}
                </div>
                {form.link_url && (
                  <span style={{
                    marginLeft: 'auto', padding: '4px 12px',
                    background: '#fff', borderRadius: 999,
                    fontSize: 12, fontWeight: 700,
                    color: form.bg_color, whiteSpace: 'nowrap',
                  }}>Shop Now →</span>
                )}
              </div>
            </div>
          </div>
          {error && <div className="adm-form-error">⚠️ {error}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn-save" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '✅ Update Ad' : '✅ Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  BANNER MODAL
// ══════════════════════════════════════════
function BannerModal({ banner, onClose, onSaved }) {
  const isEdit = !!banner;
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    title:       banner?.title       || '',
    subtitle:    banner?.subtitle    || '',
    cta_text:    banner?.cta_text    || 'Shop Now',
    cta_link:    banner?.cta_link    || '/home',
    bg_gradient: banner?.bg_gradient || 'linear-gradient(135deg, #FF3E6C 0%, #FF7043 100%)',
    image_url:   banner?.image_url   || '',
    sort_order:  banner?.sort_order  || 0,
    is_active:   banner?.is_active !== false && banner?.is_active !== 0,
  });

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title required'); return; }
    setError(''); setLoading(true);
    try {
      isEdit ? await api.updateBanner(banner.id, form) : await api.createBanner(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradients = [
    { label: 'Pink-Orange',   value: 'linear-gradient(135deg, #FF3E6C 0%, #FF7043 100%)' },
    { label: 'Purple-Teal',   value: 'linear-gradient(135deg, #6C63FF 0%, #48C9B0 100%)' },
    { label: 'Yellow-Orange', value: 'linear-gradient(135deg, #FFB400 0%, #FF7043 100%)' },
    { label: 'Blue-Purple',   value: 'linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)' },
    { label: 'Green-Teal',    value: 'linear-gradient(135deg, #4CAF50 0%, #00BCD4 100%)' },
    { label: 'Dark Pink',     value: 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)' },
  ];

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <div className="adm-modal-header">
          <h2>{isEdit ? '✏️ Edit Banner' : '➕ Add Hero Banner'}</h2>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-pform" onSubmit={submit}>
          <div className="adm-pform-grid">
            <div className="apf apf-full">
              <label>Banner Title *</label>
              <input name="title" value={form.title} onChange={handle}
                placeholder="e.g. Summer Sale" required />
            </div>
            <div className="apf apf-full">
              <label>Subtitle</label>
              <input name="subtitle" value={form.subtitle} onChange={handle}
                placeholder="e.g. Up to 80% OFF on Fashion" />
            </div>
            <div className="apf">
              <label>Button Text</label>
              <input name="cta_text" value={form.cta_text} onChange={handle} placeholder="Shop Now" />
            </div>
            <div className="apf">
              <label>Button Link</label>
              <input name="cta_link" value={form.cta_link} onChange={handle}
                placeholder="/home or /home?cat=women" />
            </div>
            <div className="apf apf-full">
              <label>Banner Image URL</label>
              <input name="image_url" value={form.image_url} onChange={handle}
                placeholder="https://example.com/banner.jpg" />
              {form.image_url && (
                <img src={form.image_url} alt="preview"
                  style={{ marginTop: 8, height: 80, objectFit: 'cover', borderRadius: 8, width: '100%' }}
                  onError={e => e.target.style.display='none'} />
              )}
            </div>
            <div className="apf apf-full">
              <label>Background Gradient</label>
              <div className="adm-gradient-presets">
                {gradients.map(g => (
                  <button key={g.value} type="button"
                    className={`adm-gradient-btn ${form.bg_gradient === g.value ? 'selected' : ''}`}
                    style={{ background: g.value }}
                    onClick={() => setForm(f => ({ ...f, bg_gradient: g.value }))}>
                    {form.bg_gradient === g.value && '✓'}
                  </button>
                ))}
              </div>
              <input name="bg_gradient" value={form.bg_gradient} onChange={handle}
                placeholder="linear-gradient(135deg, #FF3E6C 0%, #FF7043 100%)"
                style={{ marginTop: 8 }} />
            </div>
            <div className="apf">
              <label>Sort Order <small>(lower = first)</small></label>
              <input type="number" name="sort_order" value={form.sort_order}
                onChange={handle} min="0" onWheel={e => e.target.blur()} />
            </div>
            <div className="apf apf-check">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handle} />
                Active (Show on homepage)
              </label>
            </div>
            <div className="apf apf-full">
              <label>Live Preview</label>
              <div className="adm-banner-live-preview" style={{ background: form.bg_gradient }}>
                <div className="adm-banner-live-text">
                  <strong>{form.title || 'Banner Title'}</strong>
                  <span>{form.subtitle || 'Subtitle here'}</span>
                  <div className="adm-banner-live-cta">{form.cta_text || 'Shop Now'} →</div>
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="preview"
                    onError={e => e.target.style.display='none'} />
                )}
              </div>
            </div>
          </div>
          {error && <div className="adm-form-error">⚠️ {error}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn-save" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '✅ Update Banner' : '✅ Add Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ══════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Tabs & UI ──
  const [tab,         setTab]         = useState('overview');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [msg,         setMsg]         = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Data ──
  const [dashboard,   setDash]        = useState(null);
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [users,       setUsers]       = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [pageViews,   setPageViews]   = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ads,         setAds]         = useState([]);
  const [banners,     setBanners]     = useState([]);

  // ── Modal states ──
  const [showModal,       setShowModal]       = useState(false);
  const [editProduct,     setEditProduct]     = useState(null);
  const [showAdModal,     setShowAdModal]     = useState(false);
  const [editAd,          setEditAd]          = useState(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editBanner,      setEditBanner]      = useState(null);

  // ── Filters ──
  const [search,            setSearch]            = useState('');
  const [stockLoading,      setStockLoading]      = useState(null);
  const [expandedOrder,     setExpandedOrder]     = useState(null);
  const [orderDateFilter,   setOrderDateFilter]   = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [replyText,         setReplyText]         = useState({});
  const [replyingTo,        setReplyingTo]        = useState(null);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/admin'); return; }
    loadAll();
    intervalRef.current = setInterval(() => silentRefresh(), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user]);

  // ── LOAD ALL ──
  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, p, c, u, o, v, m, adsData, bannersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getSellerProducts(),
        api.getAdminCategories(),
        api.getUsers(),
        api.getAdminOrders(),
        api.getPageViews(),
        api.getContactMessages(),
        api.getAdminAds(),
        api.getAdminBanners(),
      ]);
      setDash(d);
      setProducts(p.products          || []);
      setCategories(c.categories      || []);
      setUsers(u.users                || []);
      setOrders(o.orders              || []);
      setPageViews(v);
      setMessages(m.messages          || []);
      setUnreadCount(m.unread         || 0);
      setAds(adsData.ads              || []);
      setBanners(bannersData.banners  || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('loadAll error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── SILENT REFRESH ──
  const silentRefresh = async () => {
    try {
      const [d, p, u, o, v, m, adsData, bannersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getSellerProducts(),
        api.getUsers(),
        api.getAdminOrders(),
        api.getPageViews(),
        api.getContactMessages(),
        api.getAdminAds(),
        api.getAdminBanners(),
      ]);
      setDash(d);
      setProducts(p.products          || []);
      setUsers(u.users                || []);
      setOrders(o.orders              || []);
      setPageViews(v);
      setMessages(m.messages          || []);
      setUnreadCount(m.unread         || 0);
      setAds(adsData.ads              || []);
      setBanners(bannersData.banners  || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Silent refresh error:', err);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await silentRefresh();
    setRefreshing(false);
    flash('Dashboard refreshed!');
  };

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(''), 3000);
  };

  // ── ACTIONS ──
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(ps => ps.filter(p => p.id !== id));
      flash('Product deleted successfully');
    } catch (err) { flash(err.message, true); }
  };

  const handleToggleStock = async (productId) => {
    setStockLoading(productId);
    try {
      const data = await api.toggleStock(productId);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: data.stock } : p));
      flash(data.message);
    } catch (err) { flash(err.message, true); }
    finally { setStockLoading(null); }
  };

  const handleToggleCategory = async (cat) => {
    try {
      await api.toggleCategory(cat.id);
      setCategories(cats => cats.map(c =>
        c.id === cat.id ? { ...c, is_active: c.is_active ? 0 : 1 } : c
      ));
      flash(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) { flash(err.message, true); }
  };

  const toggleUser = async (id) => {
    try {
      await api.toggleUserActive(id);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      flash('User status updated');
    } catch (err) { flash(err.message, true); }
  };

  const updateOrder = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      flash('Order status updated');
    } catch (err) { flash(err.message, true); }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const getFilteredOrders = () => {
    let list = [...orders];
    if (orderDateFilter) {
      list = list.filter(o =>
        new Date(o.created_at).toLocaleDateString('en-CA') === orderDateFilter
      );
    }
    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }
    return list;
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="adm-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const t = dashboard?.totals || {};

  const navItems = [
    { id: 'overview',   icon: '📊', label: 'Overview'      },
    { id: 'products',   icon: '📦', label: 'Products'      },
    { id: 'categories', icon: '🗂️', label: 'Categories'   },
    { id: 'orders',     icon: '🛒', label: 'Orders'        },
    { id: 'customers',  icon: '👥', label: 'Customers'     },
    { id: 'messages',   icon: '💬', label: 'Messages'      },
    { id: 'ads',        icon: '📢', label: 'Ads'           },
    { id: 'banners',    icon: '🖼️', label: 'Hero Banners' },
  ];

  return (
    <>
      <div className="adm-layout">

        {/* ══ SIDEBAR ══ */}
        <aside className="adm-sidebar">
          <div className="adm-sidebar-brand">
            <span className="adm-brand-icon">🛍️</span>
            <div>
              <strong>E-Commerce</strong>
              <small>Admin Panel</small>
            </div>
          </div>
          <nav className="adm-nav">
            {navItems.map(item => (
              <button key={item.id}
                className={`adm-nav-btn ${tab === item.id ? 'active' : ''}`}
                onClick={() => setTab(item.id)}>
                <span className="adm-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'messages' && unreadCount > 0 && (
                  <span className="adm-nav-unread">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="adm-sidebar-user">
            <div className="adm-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div className="adm-user-info">
              <p>{user?.name}</p>
              <small>Administrator</small>
            </div>
            <button className="adm-logout-btn" onClick={() => { logout(); navigate('/admin'); }}>
              ⏻ Logout
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main className="adm-main">

          {/* Topbar */}
          <div className="adm-topbar">
            <div className="adm-topbar-left">
              <h1>
                {tab === 'overview'   && 'Dashboard Overview'}
                {tab === 'products'   && 'Products Management'}
                {tab === 'categories' && 'Categories Management'}
                {tab === 'orders'     && 'All Orders'}
                {tab === 'customers'  && 'Customers'}
                {tab === 'messages'   && 'Contact Messages'}
                {tab === 'ads'        && 'Ads Management'}
                {tab === 'banners'    && 'Hero Banners'}
              </h1>
              <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', display: 'block' }}>
                Last updated: {lastRefresh.toLocaleTimeString('en-IN')} · Auto-refreshes every 30s
              </small>
            </div>
            <div className="adm-topbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleManualRefresh} disabled={refreshing} className="adm-btn-refresh">
                {refreshing ? '⏳' : '🔄'} Refresh
              </button>
              {tab === 'products' && (
                <button className="adm-btn-primary"
                  onClick={() => { setEditProduct(null); setShowModal(true); }}>
                  + Add Product
                </button>
              )}
            </div>
          </div>

          {/* Flash */}
          {msg && (
            <div className={`adm-flash ${msg.isError ? 'adm-flash-err' : 'adm-flash-ok'}`}>
              {msg.isError ? '⚠️' : '✅'} {msg.text}
            </div>
          )}

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="adm-content">
              <div className="adm-stats-grid">
                {[
                  { label: 'Total Revenue',    value: `₹${Number(t.total_revenue||0).toLocaleString()}`, icon: '💰', color: '#FF3E6C' },
                  { label: 'Total Orders',     value: t.total_orders    || 0, icon: '📦', color: '#6C63FF' },
                  { label: 'Products',         value: t.total_products  || 0, icon: '🏷️', color: '#14C38E' },
                  { label: 'Customers',        value: t.total_customers || 0, icon: '👥', color: '#FFB400' },
                  { label: 'Pending Orders',   value: t.pending_orders  || 0, icon: '⏳', color: '#FF7043' },
                  { label: 'Total Page Visits',value: pageViews?.total  || 0, icon: '👁️', color: '#6C63FF' },
                  { label: "Today's Visits",   value: pageViews?.today  || 0, icon: '📅', color: '#14C38E' },
                  { label: 'Unread Messages',  value: t.unread_messages || 0, icon: '💬', color: '#FF3E6C' },
                  { label: 'Total Messages',   value: messages.length   || 0, icon: '📩', color: '#6C63FF' },
                ].map(s => (
                  <div key={s.label} className="adm-stat-card" style={{ '--clr': s.color }}>
                    <div className="adm-stat-icon">{s.icon}</div>
                    <div className="adm-stat-body">
                      <div className="adm-stat-value">{s.value}</div>
                      <div className="adm-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {pageViews?.topPages?.length > 0 && (
                <div className="adm-card">
                  <h3>📊 Most Visited Pages</h3>
                  <table className="adm-table">
                    <thead><tr><th>#</th><th>Page</th><th>Views</th></tr></thead>
                    <tbody>
                      {pageViews.topPages.map((p, i) => (
                        <tr key={i}>
                          <td><strong>{i + 1}</strong></td>
                          <td>{p.page}</td>
                          <td><span className="adm-views-badge">{p.views}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(() => {
                const months = [];
                for (let i = 5; i >= 0; i--) {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                  const label = d.toLocaleString('en-IN', { month: 'short' });
                  const found = dashboard?.monthly?.find(m => m.month === key);
                  months.push({ key, label, revenue: Number(found?.revenue || 0), orders: found?.orders || 0 });
                }
                const max = Math.max(...months.map(m => m.revenue), 1);
                return (
                  <div className="adm-card">
                    <h3>Monthly Revenue (Last 6 Months)</h3>
                    <div className="adm-bar-chart">
                      {months.map(m => {
                        const pct = (m.revenue / max) * 100;
                        return (
                          <div key={m.key} className="adm-bar-col">
                            <div className="adm-bar-tip">
                              ₹{m.revenue.toLocaleString()}<br/>
                              <small>{m.orders} orders</small>
                            </div>
                            <div className="adm-bar" style={{ height: `${Math.max(pct, m.revenue > 0 ? 4 : 0)}%` }}/>
                            <span>{m.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Recent Messages Preview in Overview */}
              {messages.length > 0 && (
                <div className="adm-card">
                  <h3>💬 Recent Messages
                    {unreadCount > 0 && (
                      <span className="adm-unread-badge" style={{ marginLeft: 10 }}>
                        {unreadCount} unread
                      </span>
                    )}
                  </h3>
                  <table className="adm-table">
                    <thead>
                      <tr><th>Name</th><th>Subject</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {messages.slice(0, 5).map(m => (
                        <tr key={m.id} style={{ cursor: 'pointer' }}
                          onClick={() => setTab('messages')}>
                          <td><strong>{m.name}</strong><small>{m.email}</small></td>
                          <td>{m.subject || '—'}</td>
                          <td>
                            <span style={{
                              fontSize: 11, fontWeight: 700,
                              color: m.status === 'unread'  ? '#0277BD'
                                   : m.status === 'replied' ? '#0A7D56' : '#9090A0'
                            }}>
                              {m.status === 'unread' ? '🔵 Unread'
                               : m.status === 'replied' ? '✅ Replied' : '👁️ Read'}
                            </span>
                          </td>
                          <td><small>{new Date(m.created_at).toLocaleDateString('en-IN')}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {messages.length > 5 && (
                    <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
                      <button className="adm-btn-edit" onClick={() => setTab('messages')}>
                        View All {messages.length} Messages →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {orders.length > 0 && (
                <div className="adm-card">
                  <h3>Recent Orders</h3>
                  <table className="adm-table">
                    <thead>
                      <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td><strong>#{o.id}</strong></td>
                          <td>{o.customer_name}</td>
                          <td><strong>₹{Number(o.total_amount).toLocaleString()}</strong></td>
                          <td><Badge status={o.status} /></td>
                          <td><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ PRODUCTS ══ */}
          {tab === 'products' && (
            <div className="adm-content">
              <div className="adm-search-bar">
                <input type="text" placeholder="🔍 Search products..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                <span>{filteredProducts.length} products</span>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="adm-empty">
                  <span>📦</span><p>No products found</p>
                  <button className="adm-btn-primary"
                    onClick={() => { setEditProduct(null); setShowModal(true); }}>
                    + Add First Product
                  </button>
                </div>
              ) : (
                <div className="adm-card">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Image</th><th>Product</th><th>Category</th>
                        <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id}>
                          <td>
                            <img src={getImgUrl(p.images?.[0]) || ''} alt={p.name}
                              className="adm-product-thumb"
                              onError={e => e.target.style.display='none'} />
                          </td>
                          <td><strong>{p.name}</strong><small>{p.brand}</small></td>
                          <td>{p.category_name}</td>
                          <td>
                            <strong>₹{Number(p.price).toLocaleString()}</strong>
                            <small>MRP ₹{Number(p.original_price).toLocaleString()}</small>
                          </td>
                          <td>
                            <span className={p.stock > 0 ? 'adm-stock-ok' : 'adm-stock-out'}>
                              {p.stock > 0 ? `${p.stock} left` : 'Out of Stock'}
                            </span>
                          </td>
                          <td><Badge status={p.is_active ? 'active' : 'inactive'} /></td>
                          <td>
                            <div className="adm-actions">
                              <button
                                className={p.stock > 0 ? 'adm-btn-stock-out' : 'adm-btn-stock-in'}
                                onClick={() => handleToggleStock(p.id)}
                                disabled={stockLoading === p.id}>
                                {stockLoading === p.id ? '...' : p.stock > 0 ? '📦 Out of Stock' : '✅ In Stock'}
                              </button>
                              <button className="adm-btn-edit"
                                onClick={() => { setEditProduct(p); setShowModal(true); }}>
                                ✏️ Edit
                              </button>
                              <button className="adm-btn-delete" onClick={() => handleDelete(p.id)}>
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ CATEGORIES ══ */}
          {tab === 'categories' && (
            <div className="adm-content">
              <div className="adm-cat-info">
                💡 Active categories are visible on the user's home page — toggle to show/hide them
              </div>
              <div className="adm-cat-grid">
                {categories.map(c => (
                  <div key={c.id} className={`adm-cat-card ${c.is_active ? 'cat-active' : 'cat-inactive'}`}>
                    <button className={`adm-cat-toggle-btn ${c.is_active ? 'on' : 'off'}`}
                      onClick={() => handleToggleCategory(c)}>
                      {c.is_active ? '✓' : '✕'}
                    </button>
                    <span className="adm-cat-emoji">{c.emoji}</span>
                    <strong>{c.name}</strong>
                    <small>/{c.slug}</small>
                    <span className={`adm-cat-status ${c.is_active ? 'on' : 'off'}`}>
                      {c.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {tab === 'orders' && (
            <div className="adm-content">

              {/* Filters */}
              <div className="adm-order-filters">
                <div className="adm-filter-group">
                  <label>📅 Filter by Date</label>
                  <input type="date" value={orderDateFilter}
                    onChange={e => setOrderDateFilter(e.target.value)}
                    className="adm-filter-input" />
                  {orderDateFilter && (
                    <button className="adm-filter-clear"
                      onClick={() => setOrderDateFilter('')}>✕ Clear</button>
                  )}
                </div>
                <div className="adm-filter-group">
                  <label>📦 Filter by Status</label>
                  <select value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="adm-select">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {(orderDateFilter || orderStatusFilter !== 'all') && (
                  <div className="adm-filter-result">
                    <span>
                      {getFilteredOrders().length} order{getFilteredOrders().length !== 1 ? 's' : ''} found
                    </span>
                    <button className="adm-filter-clear"
                      onClick={() => { setOrderDateFilter(''); setOrderStatusFilter('all'); }}>
                      ✕ Clear All
                    </button>
                  </div>
                )}
              </div>

              {(() => {
                const filteredOrders = getFilteredOrders();
                return filteredOrders.length === 0 ? (
                  <div className="adm-empty">
                    <span>🛒</span>
                    <p>{orders.length === 0 ? 'No orders right now.' : 'No orders match the selected filter.'}</p>
                  </div>
                ) : (
                  <div className="adm-card">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Order ID</th><th>Customer</th><th>Items</th>
                          <th>Total</th><th>Payment</th><th>Status</th>
                          <th>Date</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(o => (
                          <React.Fragment key={o.id}>
                            <tr style={{ cursor: 'pointer' }}
                              onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                              <td><strong>#{o.id}</strong></td>
                              <td>
                                <strong>{o.customer_name}</strong>
                                <small>{o.customer_email}</small>
                                <small>📞 {o.customer_phone}</small>
                              </td>
                              <td>
                                <div className="adm-order-items-preview">
                                  {o.items && o.items.length > 0 ? (
                                    <>
                                      {o.items.slice(0, 2).map((item, i) => {
                                        const imgUrl = getImgUrl(item.image);
                                        return (
                                          <div key={i} className="adm-order-item-preview">
                                            {imgUrl ? (
                                              <img src={imgUrl} alt={item.product_name}
                                                onError={e => e.target.style.display='none'} />
                                            ) : (
                                              <div className="adm-order-item-fallback">🛍️</div>
                                            )}
                                            <span>{item.product_name}</span>
                                          </div>
                                        );
                                      })}
                                      {o.items.length > 2 && (
                                        <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                          +{o.items.length - 2} more
                                        </small>
                                      )}
                                    </>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                      {o.item_count} item{o.item_count !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td><strong>₹{Number(o.total_amount).toLocaleString()}</strong></td>
                              <td><span className="adm-badge badge-info">{o.payment_method}</span></td>
                              <td><Badge status={o.status} /></td>
                              <td><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></td>
                              <td onClick={e => e.stopPropagation()}>
                                {!['delivered','cancelled'].includes(o.status) && (
                                  <select className="adm-select" value={o.status}
                                    onChange={e => updateOrder(o.id, e.target.value)}>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                )}
                              </td>
                            </tr>

                            {/* Expanded row */}
                            {expandedOrder === o.id && (
                              <tr className="adm-order-detail-row">
                                <td colSpan={8}>
                                  <div className="adm-order-detail">
                                    <div className="adm-order-detail__section">
                                      <h4>📍 Delivery Details</h4>
                                      <div className="adm-order-detail__grid">
                                        <div><span>Customer Name</span><strong>{o.customer_name}</strong></div>
                                        <div><span>Phone</span><strong>{o.customer_phone}</strong></div>
                                        <div><span>Email</span><strong>{o.customer_email}</strong></div>
                                        <div className="adm-full"><span>Delivery Address</span><strong>{o.address}</strong></div>
                                      </div>
                                    </div>
                                    <div className="adm-order-detail__section">
                                      <h4>🛒 Ordered Items</h4>
                                      {o.items?.map((item, i) => (
                                        <div key={i} className="adm-order-detail__item">
                                          {getImgUrl(item.image) && (
                                            <img src={getImgUrl(item.image)} alt={item.product_name}
                                              onError={e => e.target.style.display='none'} />
                                          )}
                                          <div>
                                            <strong>{item.product_name}</strong>
                                            <small>
                                              {item.size  && `Size: ${item.size}`}
                                              {item.color && ` | Color: ${item.color}`}
                                              {` | Qty: ${item.quantity}`}
                                            </small>
                                          </div>
                                          <strong>₹{(item.price * item.quantity).toLocaleString()}</strong>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="adm-order-detail__section">
                                      <h4>💳 Payment Info</h4>
                                      <div className="adm-order-detail__grid">
                                        <div><span>Method</span><strong>{o.payment_method}</strong></div>
                                        <div><span>Status</span>
                                          <strong style={{ color: o.payment_status === 'paid' ? '#0A7D56' : '#B37A00' }}>
                                            {o.payment_status}
                                          </strong>
                                        </div>
                                        <div><span>Total Amount</span><strong>₹{Number(o.total_amount).toLocaleString()}</strong></div>
                                        <div><span>Order Date</span><strong>{new Date(o.created_at).toLocaleString('en-IN')}</strong></div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══ CUSTOMERS ══ */}
          {tab === 'customers' && (
            <div className="adm-content">
              <div className="adm-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Email</th>
                      <th>Role</th><th>Joined</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'customer').map(u => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><Badge status={u.role} /></td>
                        <td><small>{new Date(u.created_at).toLocaleDateString('en-IN')}</small></td>
                        <td><Badge status={u.is_active ? 'active' : 'inactive'} /></td>
                        <td>
                          <button
                            className={u.is_active ? 'adm-btn-delete' : 'adm-btn-edit'}
                            onClick={() => toggleUser(u.id)}>
                            {u.is_active ? '🚫 Ban' : '✅ Unban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role === 'customer').length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                          No customers yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {tab === 'messages' && (
            <div className="adm-content">
              <div className="adm-search-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    💬 Contact Messages
                  </h3>
                  {unreadCount > 0 && (
                    <span className="adm-unread-badge">{unreadCount} unread</span>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {messages.length} total
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="adm-empty">
                  <span>💬</span>
                  <p>No messages yet.</p>
                </div>
              ) : (
                <div className="adm-messages-list">
                  {messages.map(m => (
                    <div key={m.id}
                      className={`adm-msg-card ${m.status === 'unread' ? 'unread' : ''}`}>
                      <div className="adm-msg-header">
                        <div className="adm-msg-sender">
                          <div className="adm-msg-avatar">{m.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <strong>{m.name}</strong>
                            <span>{m.email}</span>
                            {m.phone && <span>📞 {m.phone}</span>}
                          </div>
                        </div>
                        <div className="adm-msg-meta">
                          {m.subject && <span className="adm-msg-subject">{m.subject}</span>}
                          <span className={`adm-msg-status ${m.status}`}>
                            {m.status === 'unread'  ? '🔵 Unread'  :
                             m.status === 'replied' ? '✅ Replied' : '👁️ Read'}
                          </span>
                          <small>{new Date(m.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}</small>
                        </div>
                      </div>

                      <div className="adm-msg-body"><p>{m.message}</p></div>

                      {m.reply && (
                        <div className="adm-msg-reply-sent">
                          <strong>✅ Your Reply:</strong>
                          <p>{m.reply}</p>
                        </div>
                      )}

                      <div className="adm-msg-actions">
                        {m.status === 'unread' && (
                          <button className="adm-btn-edit"
                            onClick={async () => {
                              await api.markMessageRead(m.id);
                              setMessages(ms => ms.map(x =>
                                x.id === m.id ? { ...x, status: 'read' } : x
                              ));
                              setUnreadCount(c => Math.max(0, c - 1));
                            }}>
                            👁️ Mark Read
                          </button>
                        )}
                        <button className="adm-btn-save"
                          style={{ fontSize: '12px', padding: '5px 14px' }}
                          onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}>
                          {replyingTo === m.id ? '✕ Close' : '↩️ Reply'}
                        </button>
                        <button className="adm-btn-delete"
                          onClick={async () => {
                            if (!window.confirm('Delete this message?')) return;
                            await api.deleteContactMessage(m.id);
                            setMessages(ms => ms.filter(x => x.id !== m.id));
                            if (m.status === 'unread') setUnreadCount(c => Math.max(0, c - 1));
                            flash('Message deleted');
                          }}>
                          🗑️ Delete
                        </button>
                      </div>

                      {replyingTo === m.id && (
                        <div className="adm-msg-reply-form">
                          <textarea
                            placeholder={`Reply to ${m.name}...`}
                            value={replyText[m.id] || ''}
                            onChange={e => setReplyText(r => ({ ...r, [m.id]: e.target.value }))}
                            rows={3}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button className="adm-btn-save"
                              onClick={async () => {
                                const reply = replyText[m.id];
                                if (!reply?.trim()) return;
                                await api.replyToMessage(m.id, { reply });
                                setMessages(ms => ms.map(x =>
                                  x.id === m.id ? { ...x, reply, status: 'replied' } : x
                                ));
                                setReplyText(r => ({ ...r, [m.id]: '' }));
                                setReplyingTo(null);
                                flash('Reply saved!');
                              }}>
                              ✅ Save Reply
                            </button>
                            <button className="adm-btn-cancel"
                              onClick={() => setReplyingTo(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ADS ══ */}
          {tab === 'ads' && (
            <div className="adm-content">
              <div className="adm-search-bar">
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>📢 Ads Management</h3>
                <button className="adm-btn-primary"
                  onClick={() => { setEditAd(null); setShowAdModal(true); }}>
                  + Create Ad
                </button>
              </div>

              {ads.length === 0 ? (
                <div className="adm-empty">
                  <span>📢</span>
                  <p>No ads yet. Create your first ad!</p>
                </div>
              ) : (
                <div className="adm-ads-list">
                  {ads.map(ad => (
                    <div key={ad.id} className={`adm-ad-card ${ad.is_active ? 'active' : 'inactive'}`}>
                      <div className="adm-ad-preview"
                        style={{ background: ad.bg_color || '#FF3E6C', color: ad.text_color || '#fff' }}>
                        {ad.image_url && (
                          <img src={ad.image_url} alt={ad.title}
                            onError={e => e.target.style.display='none'} />
                        )}
                        <div className="adm-ad-preview__text">
                          <strong>{ad.title || 'No Title'}</strong>
                          <span>{ad.description || ''}</span>
                        </div>
                        <span className="adm-ad-type-badge">{ad.type}</span>
                      </div>
                      <div className="adm-ad-info">
                        <div className="adm-ad-meta">
                          <span className="adm-ad-pos">📍 {ad.position}</span>
                          {ad.start_date && <span>From: {ad.start_date}</span>}
                          {ad.end_date   && <span>To: {ad.end_date}</span>}
                          <span style={{ fontWeight: 600, color: ad.is_active ? '#0A7D56' : '#C62828' }}>
                            {ad.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                        <div className="adm-ad-actions">
                          <button
                            className={ad.is_active ? 'adm-btn-stock-out' : 'adm-btn-stock-in'}
                            onClick={async () => {
                              await api.toggleAd(ad.id);
                              setAds(prev => prev.map(a =>
                                a.id === ad.id ? { ...a, is_active: a.is_active ? 0 : 1 } : a
                              ));
                              flash(ad.is_active ? 'Ad deactivated' : 'Ad activated');
                            }}>
                            {ad.is_active ? '⏸ Deactivate' : '▶ Activate'}
                          </button>
                          <button className="adm-btn-edit"
                            onClick={() => { setEditAd(ad); setShowAdModal(true); }}>
                            ✏️ Edit
                          </button>
                          <button className="adm-btn-delete"
                            onClick={async () => {
                              if (!window.confirm('Delete this ad?')) return;
                              await api.deleteAd(ad.id);
                              setAds(prev => prev.filter(a => a.id !== ad.id));
                              flash('Ad deleted');
                            }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAdModal && (
                <AdModal
                  ad={editAd}
                  onClose={() => { setShowAdModal(false); setEditAd(null); }}
                  onSaved={async () => {
                    setShowAdModal(false); setEditAd(null);
                    const data = await api.getAdminAds();
                    setAds(data.ads || []);
                    flash('Ad saved!');
                  }}
                />
              )}
            </div>
          )}

          {/* ══ BANNERS ══ */}
          {tab === 'banners' && (
            <div className="adm-content">
              <div className="adm-search-bar">
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>🖼️ Hero Banners</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
Manage the sliding banners displayed on the homepage.                  </p>
                </div>
                <button className="adm-btn-primary"
                  onClick={() => { setEditBanner(null); setShowBannerModal(true); }}>
                  + Add Banner
                </button>
              </div>

              {banners.length === 0 ? (
                <div className="adm-empty">
                  <span>🖼️</span>
                  <p>No banners yet. Add your first hero banner!</p>
                </div>
              ) : (
                <div className="adm-banners-list">
                  {banners.map((b, idx) => (
                    <div key={b.id} className={`adm-banner-card ${b.is_active ? '' : 'inactive'}`}>
                      <div className="adm-banner-preview" style={{ background: b.bg_gradient }}>
                        <div className="adm-banner-preview__text">
                          <strong>{b.title}</strong>
                          <span>{b.subtitle}</span>
                          <div className="adm-banner-cta">{b.cta_text} →</div>
                        </div>
                        {b.image_url && (
                          <img src={b.image_url} alt={b.title}
                            onError={e => e.target.style.display='none'} />
                        )}
                        <div className="adm-banner-order">#{idx + 1}</div>
                      </div>
                      <div className="adm-ad-info">
                        <div className="adm-ad-meta">
                          <span>🔗 {b.cta_link || '/home'}</span>
                          <span className={`adm-banner-status ${b.is_active ? 'on' : 'off'}`}>
                            {b.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                        <div className="adm-ad-actions">
                          <button
                            className={b.is_active ? 'adm-btn-stock-out' : 'adm-btn-stock-in'}
                            onClick={async () => {
                              await api.toggleBanner(b.id);
                              setBanners(prev => prev.map(x =>
                                x.id === b.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x
                              ));
                              flash(b.is_active ? 'Banner deactivated' : 'Banner activated');
                            }}>
                            {b.is_active ? '⏸ Hide' : '▶ Show'}
                          </button>
                          <button className="adm-btn-edit"
                            onClick={() => { setEditBanner(b); setShowBannerModal(true); }}>
                            ✏️ Edit
                          </button>
                          <button className="adm-btn-delete"
                            onClick={async () => {
                              if (!window.confirm('Delete this banner?')) return;
                              await api.deleteBanner(b.id);
                              setBanners(prev => prev.filter(x => x.id !== b.id));
                              flash('Banner deleted');
                            }}>
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showBannerModal && (
                <BannerModal
                  banner={editBanner}
                  onClose={() => { setShowBannerModal(false); setEditBanner(null); }}
                  onSaved={async () => {
                    setShowBannerModal(false); setEditBanner(null);
                    const data = await api.getAdminBanners();
                    setBanners(data.banners || []);
                    flash('Banner saved!');
                  }}
                />
              )}
            </div>
          )}

        </main>
      </div>

      {/* Product Modal — outside layout, always accessible */}
      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          adminId={user?.id}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={() => {
            setShowModal(false); setEditProduct(null);
            loadAll();
            flash('Product saved successfully!');
          }}
        />
      )}

      <Footer />
    </>
  );
}
