import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard/ProductCard';

export default function Wishlist() {
  const { wishlist } = useCart();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.getProducts()
      .then(data => setProducts(data.products || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // DB products ko normalize karo
  const normalizeProduct = (p) => ({
    id:            p.id,
    name:          p.name,
    brand:         p.brand          || '',
    price:         Number(p.price),
    originalPrice: Number(p.original_price),
    rating:        Number(p.avg_rating)   || 0,
    ratingCount:   Number(p.rating_count) || 0,
    image:         p.images?.[0]?.startsWith('http')
                     ? p.images[0]
                     : `http://localhost:5000${p.images?.[0] || ''}`,
    colors:        p.colors  || [],
    sizes:         p.sizes   || [],
    tags:          p.tags    || [],
    inStock:       p.stock > 0,
    category:      p.category_slug || '',
  });

  const saved = products
    .filter(p => wishlist.includes(p.id))
    .map(normalizeProduct);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <div style={{ fontSize: 48 }}>⏳</div>
        <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading...</p>
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>💝</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26, fontWeight: 800,
        }}>
          Your wishlist Is Empty
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '8px 0 24px' }}>
Save items for later!        </p>
        <Link
          to="/home"
          style={{
            background: 'var(--primary)', color: '#fff',
            padding: '12px 28px',
            borderRadius: '999px',
            fontWeight: 700, fontSize: 15,
            display: 'inline-block',
          }}
        >
Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 16px 48px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 26, fontWeight: 800,
        marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        My Wishlist
        <span style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--text-muted)',
          background: 'var(--surface)',
          padding: '3px 10px',
          borderRadius: 999,
        }}>
          {saved.length} items
        </span>
      </h1>
      <div className="grid-products">
        {saved.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}