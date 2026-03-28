import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './ProductForm.css';

export default function ProductForm({ product, onClose, onSaved }) {
  const isEdit = !!product;

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [imageMode,  setImageMode]  = useState('url');
  const [imageUrls,  setImageUrls]  = useState(product?.images?.join('\n') || '');
  const [files,      setFiles]      = useState([]);
  const [previews,   setPreviews]   = useState(product?.images || []);
  

  const [form, setForm] = useState({
    name:           product?.name           || '',
    description:    product?.description    || '',
    brand:          product?.brand          || '',
    price:          product?.price          || '',
    original_price: product?.original_price || '',
    stock:          product?.stock          || '',
    category_id:    product?.category_id    || '',
    sizes:          product?.sizes?.join(',')  || '',
    colors:         product?.colors?.join(',') || '',
    tags:           product?.tags?.join(',')   || '',
    is_active:      product?.is_active !== false,
  });

  useEffect(() => {
    api.getCategories().then(d => setCategories(d.categories));
  }, []);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handleUrlChange = (e) => {
    setImageUrls(e.target.value);
    setPreviews(
      e.target.value.split('\n').map(u => u.trim()).filter(Boolean)
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (imageMode === 'file' && files.length > 0) {
        files.forEach(f => fd.append('images', f));
      } else {
        imageUrls.split('\n').map(u => u.trim()).filter(Boolean)
          .forEach(u => fd.append('images', u));
      }

      isEdit
        ? await api.updateProduct(product.id, fd)
        : await api.createProduct(fd);

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="pform" onSubmit={submit}>
          <div className="pform-grid">

            <div className="pf pf-full">
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handle}
                placeholder="e.g. Floral Maxi Dress" required />
            </div>

            <div className="pf">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handle}
                placeholder="e.g. StyleCo" />
            </div>

            <div className="pf">
              <label>Category *</label>
              <select name="category_id" value={form.category_id}
                onChange={handle} required>
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="pf">
              <label>Selling Price (₹) *</label>
              <input name="price" type="number" min="1" value={form.price}
                onChange={handle} placeholder="799" required />
            </div>

            <div className="pf">
              <label>MRP / Original Price (₹) *</label>
              <input name="original_price" type="number" min="1"
                value={form.original_price} onChange={handle}
                placeholder="1999" required />
            </div>

            <div className="pf">
              <label>Stock Quantity</label>
              <input name="stock" type="number" min="0" value={form.stock}
                onChange={handle} placeholder="100" />
            </div>

            <div className="pf">
              <label>Sizes <small>(comma separated)</small></label>
              <input name="sizes" value={form.sizes} onChange={handle}
                placeholder="S, M, L, XL" />
            </div>

            <div className="pf">
              <label>Colors <small>(comma separated)</small></label>
              <input name="colors" value={form.colors} onChange={handle}
                placeholder="#FF0000, #00FF00" />
            </div>

            <div className="pf">
              <label>Tags <small>(comma separated)</small></label>
              <input name="tags" value={form.tags} onChange={handle}
                placeholder="Trending, New, Sale" />
            </div>

            <div className="pf pf-check">
              <label>
                <input type="checkbox" name="is_active"
                  checked={form.is_active} onChange={handle} />
                Active (store par dikhega)
              </label>
            </div>

            <div className="pf pf-full">
              <label>Description</label>
              <textarea name="description" value={form.description}
                onChange={handle} rows={3}
                placeholder="Product ke baare mein likho..." />
            </div>

            <div className="pf pf-full">
              <label>Product Images</label>
              <div className="img-mode-tabs">
                <button type="button"
                  className={imageMode === 'url' ? 'active' : ''}
                  onClick={() => setImageMode('url')}>
                  🔗 Image URLs
                </button>
                <button type="button"
                  className={imageMode === 'file' ? 'active' : ''}
                  onClick={() => setImageMode('file')}>
                  📁 Upload Files
                </button>
              </div>

              {imageMode === 'url' ? (
                <textarea
                  value={imageUrls}
                  onChange={handleUrlChange}
                  rows={3}
                  placeholder={
                    "Image URLs paste karo (ek line mein ek)\nhttps://example.com/image1.jpg"
                  }
                />
              ) : (
                <input
                  type="file" multiple accept="image/*"
                  onChange={handleFiles}
                />
              )}

              {previews.length > 0 && (
                <div className="img-previews">
                  {previews.slice(0, 5).map((src, i) => (
                    <img
                      key={i} src={src} alt=""
                      onError={e => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="pform-error">⚠️ {error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? 'Saving...'
                : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}