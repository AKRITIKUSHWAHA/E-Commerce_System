import React, { useState } from 'react';
import { api } from '../../../services/api';

const GRADIENTS = [
  { label: 'Pink-Orange',   value: 'linear-gradient(135deg, #FF3E6C 0%, #FF7043 100%)' },
  { label: 'Purple-Teal',   value: 'linear-gradient(135deg, #6C63FF 0%, #48C9B0 100%)' },
  { label: 'Yellow-Orange', value: 'linear-gradient(135deg, #FFB400 0%, #FF7043 100%)' },
  { label: 'Blue-Purple',   value: 'linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)' },
  { label: 'Green-Teal',    value: 'linear-gradient(135deg, #4CAF50 0%, #00BCD4 100%)' },
  { label: 'Dark Pink',     value: 'linear-gradient(135deg, #E91E63 0%, #FF5722 100%)' },
];

export default function BannerModal({ banner, onClose, onSaved }) {
  const isEdit = !!banner;
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Product picker
  const [showPicker,    setShowPicker]    = useState(false);
  const [products,      setProducts]      = useState([]);
  const [pickerSearch,  setPickerSearch]  = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);

  const [form, setForm] = useState({
    title:       banner?.title       || '',
    subtitle:    banner?.subtitle    || '',
    cta_text:    banner?.cta_text    || 'Shop Now',
    cta_link:    banner?.cta_link    || '/home',
    bg_gradient: banner?.bg_gradient || GRADIENTS[0].value,
    image_url:   banner?.image_url   || '',
    sort_order:  banner?.sort_order  || 0,
    is_active:   banner?.is_active !== false && banner?.is_active !== 0,
  });

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openPicker = async () => {
    setShowPicker(true);
    setPickerLoading(true);
    try {
      const data = await api.getSellerProducts();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setPickerLoading(false); }
  };

  const selectProduct = (product) => {
    setForm(f => ({ ...f, cta_link: `/product/${product.id}` }));
    setShowPicker(false);
    setPickerSearch('');
  };

  const selectQuickLink = (link) => {
    setForm(f => ({ ...f, cta_link: link }));
    setShowPicker(false);
    setPickerSearch('');
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

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img}`;
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(pickerSearch.toLowerCase())
  );

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

            {/* ── Button Link — Camera Picker ── */}
            <div className="apf">
              <label>Button Link <small>(product ya page)</small></label>
              <div className="adm-link-picker-row">
                <input
                  name="cta_link"
                  value={form.cta_link}
                  onChange={handle}
                  placeholder="/home or /product/5"
                  className="adm-link-picker-input"
                />
                <button
                  type="button"
                  className="adm-link-camera-btn"
                  onClick={openPicker}
                  title="Product ya page select karo"
                >
                  📷
                </button>
                {form.cta_link && (
                  <button
                    type="button"
                    className="adm-link-clear-btn"
                    onClick={() => setForm(f => ({ ...f, cta_link: '' }))}
                    title="Clear"
                  >✕</button>
                )}
              </div>
              {form.cta_link && (
                <div className="adm-link-preview-tag">🔗 {form.cta_link}</div>
              )}
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
                {GRADIENTS.map(g => (
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

            {/* Live Preview */}
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

      {/* ── Product Picker Modal ── */}
      {showPicker && (
        <div className="adm-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="adm-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-picker-header">
              <h3>🔗 Select Link Target</h3>
              <button className="adm-modal-close" onClick={() => setShowPicker(false)}>✕</button>
            </div>

            {/* Quick links */}
            <div className="adm-picker-quick">
              <p className="adm-picker-section-label">📄 Quick Pages</p>
              {[
                { label: '🏠 Home Page',      link: '/home' },
                { label: '👗 Women Category', link: '/home?cat=women' },
                { label: '👔 Men Category',   link: '/home?cat=men' },
                { label: '👶 Kids Category',  link: '/home?cat=kids' },
                { label: '🛍️ Sale Category', link: '/home?cat=sale' },
              ].map(item => (
                <button
                  key={item.link}
                  type="button"
                  className="adm-picker-quick-btn"
                  onClick={() => selectQuickLink(item.link)}
                >
                  {item.label}
                  <span className="adm-picker-quick-link">{item.link}</span>
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="adm-picker-products">
              <p className="adm-picker-section-label">📦 Products</p>
              <input
                type="text"
                className="adm-picker-search"
                placeholder="🔍 Search product..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
              <div className="adm-picker-list">
                {pickerLoading ? (
                  <div className="adm-picker-loading">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="adm-picker-empty">No products found</div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="adm-picker-item"
                      onClick={() => selectProduct(p)}
                    >
                      {p.images?.[0] && (
                        <img
                          src={getImgUrl(p.images[0])}
                          alt={p.name}
                          onError={e => e.target.style.display='none'}
                        />
                      )}
                      <div className="adm-picker-item-info">
                        <strong>{p.name}</strong>
                        <span>{p.category_name} · ₹{Number(p.price).toLocaleString()}</span>
                      </div>
                      <span className="adm-picker-item-link">/product/{p.id}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
