import React, { useState } from 'react';
import { api } from '../../../services/api';
import { Badge, getImgUrl } from '../AdminDashboard';

export default function TabProducts({ products, setProducts, onEdit, flash }) {
  const [search,       setSearch]       = useState('');
  const [stockLoading, setStockLoading] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="adm-content">
      <div className="adm-search-bar">
        <input type="text" placeholder="🔍 Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span>{filtered.length} products</span>
      </div>

      {filtered.length === 0 ? (
        <div className="adm-empty">
          <span>📦</span><p>No products found</p>
          <button className="adm-btn-primary" onClick={() => onEdit(null)}>
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
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <img src={getImgUrl(p.images?.[0]) || ''} alt={p.name}
                      className="adm-product-thumb"
                      onError={e => e.target.style.display='none'} />
                  </td>
                  {/* FIX: Yahan humne p.name ko bold kiya hai taaki product name dikhe */}
                  <td><strong>{p.name}</strong><small>{p.brand || 'No Brand'}</small></td>
                  {/* Category Section: Agar name nahi hai toh fallback dikhayega */}
                  <td>{p.category_name || p.category || 'General'}</td>
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
                      <button className="adm-btn-edit" onClick={() => onEdit(p)}>✏️ Edit</button>
                      <button className="adm-btn-delete" onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}