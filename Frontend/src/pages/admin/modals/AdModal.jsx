import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export default function AdModal({ ad, onClose, onSaved }) {
  const isEdit = !!ad;
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Product picker state
  const [showPicker,   setShowPicker]   = useState(false);
  const [products,     setProducts]     = useState([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading,setPickerLoading]= useState(false);

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

  // Load products for picker
  const openPicker = async () => {
    setShowPicker(true);
    setPickerLoading(true);
    try {
      const data = await api.getSellerProducts();
      setProducts(data.products || []);
    } catch { setProducts([]); }
    finally { setPickerLoading(false); }
  };

  // Product selected → fill link_url
  const selectProduct = (product) => {
    setForm(f => ({ ...f, link_url: `/product/${product.id}` }));
    setShowPicker(false);
    setPickerSearch('');
  };

  // Category selected
  const selectCategory = (slug) => {
    setForm(f => ({ ...f, link_url: `/home?cat=${slug}` }));
    setShowPicker(false);
    setPickerSearch('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      isEdit ? await api.updateAd(ad.id, form) : await api.createAd(form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const getImgUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img}`;
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

            {/* ── Click Link — Camera Picker ── */}
            <div className="apf apf-full">
              <label>Click Link <small>(product ya page select karo)</small></label>
              <div className="adm-link-picker-row">
                <input
                  name="link_url"
                  value={form.link_url}
                  onChange={handle}
                  placeholder="/home?cat=women  ya  /product/5"
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
                {form.link_url && (
                  <button
                    type="button"
                    className="adm-link-clear-btn"
                    onClick={() => setForm(f => ({ ...f, link_url: '' }))}
                    title="Clear link"
                  >✕</button>
                )}
              </div>
              {form.link_url && (
                <div className="adm-link-preview-tag">
                  🔗 {form.link_url}
                </div>
              )}
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

            {/* Live Preview */}
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
                { label: '🏠 Home Page',       link: '/home' },
                { label: '👗 Women Category',  link: '/home?cat=women' },
                { label: '👔 Men Category',    link: '/home?cat=men' },
                { label: '👶 Kids Category',   link: '/home?cat=kids' },
                { label: '🛍️ Sale Category',  link: '/home?cat=sale' },
              ].map(item => (
                <button
                  key={item.link}
                  type="button"
                  className="adm-picker-quick-btn"
                  onClick={() => selectCategory(item.link.replace('/home?cat=', ''))}
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
