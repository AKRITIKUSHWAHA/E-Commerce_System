import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Hero         from '../components/Hero/Hero';
import Filters      from '../components/Filters/Filters';
import ProductCard from '../components/ProductCard/ProductCard';
import { api }      from '../services/api';
import AdsDisplay from '../components/AdsDisplay/AdsDisplay';
import './Home.css';

const defaultFilters = {
  category: 'all',
  sort:     'default',
  priceMin: '',
  priceMax: '',
  rating:   0,
  inStock:  false,
};

export default function Home({ searchQuery }) {
  const location = useLocation();

  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    return params.get('cat') || 'all';
  };

  const [filters,    setFilters]    = useState({ ...defaultFilters, category: getInitialCategory() });
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || 'all';
    setFilters(f => ({ ...f, category: cat }));
  }, [location.search]);

  useEffect(() => {
    fetchAll(false);
    const interval = setInterval(() => fetchAll(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodData.products     || []);
      setCategories(catData.categories || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...products];
    const activeSlugs = categories.map(c => c.slug);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q)          ||
        p.brand?.toLowerCase().includes(q)         ||
        p.category_slug?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filters.category !== 'all') {
      list = list.filter(p => p.category_slug === filters.category);
    } else {
      list = list.filter(p => activeSlugs.includes(p.category_slug));
    }

    // Fixed: Price filters logic corrected (added list = ...)
    if (filters.priceMin !== '') list = list.filter(p => p.price >= Number(filters.priceMin));
    if (filters.priceMax !== '') list = list.filter(p => p.price <= Number(filters.priceMax));
    
    if (filters.rating > 0)      list = list.filter(p => parseFloat(p.avg_rating) >= filters.rating);
    if (filters.inStock)          list = list.filter(p => p.stock > 0);

    switch (filters.sort) {
      case 'price-asc':  list.sort((a,b) => a.price - b.price); break;
      case 'price-desc': list.sort((a,b) => b.price - a.price); break;
      case 'rating':     list.sort((a,b) => parseFloat(b.avg_rating||0) - parseFloat(a.avg_rating||0)); break;
      case 'discount':
        list.sort((a,b) =>
          ((b.original_price - b.price) / b.original_price) -
          ((a.original_price - a.price) / a.original_price)
        );
        break;
      default: break;
    }
    return list;
  }, [products, filters, searchQuery, categories]);

  return (
    <div className="home-page">
      <Hero />
      <AdsDisplay position="home_top" />

      <div className="container">
        <div className="cat-strip">
          <button
            className={`cat-pill ${filters.category === 'all' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, category: 'all' }))}
          >
            <span>🛍️</span> All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`cat-pill ${filters.category === cat.slug ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, category: cat.slug }))}
            >
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>
      <AdsDisplay position="home_middle" />

      <div className="container home-layout">
        <div className="home-sidebar">
          <Filters filters={filters} onChange={setFilters} categories={categories} />
        </div>

        <div className="home-main">
          <div className="mobile-filter">
            <Filters filters={filters} onChange={setFilters} categories={categories} />
          </div>

          <div className="results-header">
            <span className="results-count">
              {loading
                ? 'Loading...'
                : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
              {searchQuery && <> for "<strong>{searchQuery}</strong>"</>}
            </span>
          </div>

          {loading ? (
            <div className="grid-products">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="product-skeleton">
                  <div className="skeleton skeleton-img" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text-sm" />
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid-products">
              {filtered.map((product, i) => (
                <div key={product.id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <ProductCard product={normalizeProduct(product)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span>😕</span>
              <h3>No Products Found</h3>
              <p>Try changing filters or search for something else.</p>
              <button onClick={() => setFilters(defaultFilters)}>Clear All Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeProduct(p) {
  const getImg = (img) => {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `http://localhost:5000${img}`;
  };
  return {
    id:            p.id,
    name:          p.name,
    brand:         p.brand              || '',
    price:         Number(p.price),
    originalPrice: Number(p.original_price),
    rating:        parseFloat(p.avg_rating)    || 0,
    ratingCount:   Number(p.rating_count)      || 0,
    image:         getImg(p.images?.[0]),
    images:        (p.images || []).map(getImg),
    colors:        p.colors   || [],
    sizes:         p.sizes    || [],
    tags:          p.tags     || [],
    inStock:       p.stock > 0,
    stock:         p.stock    || 0,
    category:      p.category_slug || '',
    avg_rating:    parseFloat(p.avg_rating) || 0,
  };
}