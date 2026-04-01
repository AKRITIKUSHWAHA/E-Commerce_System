import React, { useState } from 'react';
import { api } from '../../../services/api';

export default function ProductModal({ product, categories, adminId, onClose, onSaved }) {
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
    setError(''); setLoading(true);
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
        form.image_urls.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5)
          .forEach(u => fd.append('images', u));
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
              <input name="name" value={form.name} onChange={handle}
                placeholder="e.g. Floral Maxi Dress" required />
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
                placeholder="e.g. 10" onWheel={e => e.target.blur()} />
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

            {/* Disclaimer */}
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
                  <p className="adm-disclaimer-note">ℹ️ This disclaimer will be shown at checkout.</p>
                </div>
              )}
            </div>

            {/* Images */}
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
                  onChange={e => {
                    handle(e);
                    setPreviews(e.target.value.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 5));
                  }}
                  rows={4}
                  placeholder={"Every line should have an image URL (max 5):\nhttps://example.com/image1.jpg"} />
              )}
              {imgMode === 'file' && (
                <div className="adm-upload-zone">
                  <input type="file" multiple accept="image/*" id="img-file-upload"
                    style={{ display: 'none' }}
                    onChange={e => {
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
                      <img src={src} alt="" onError={e => e.target.style.display='none'} />
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
