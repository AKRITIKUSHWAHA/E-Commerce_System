import React, { useState } from 'react';
import './Filters.css';

const sortOptions = [
  { value: 'default',    label: 'Relevance'         },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated'          },
  { value: 'discount',   label: 'Best Discount'      },
];

export default function Filters({ filters, onChange, categories = [] }) {
  const [open, setOpen] = useState(false);

  const update = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <>
      {/* Mobile top bar */}
      <div className="filter-bar">
        <button
          className="filter-bar__toggle"
          onClick={() => setOpen(!open)}
        >
          ⚙️ Filters {open ? '▲' : '▼'}
        </button>
        <div className="filter-bar__sort">
          <label>Sort:</label>
          <select
            value={filters.sort}
            onChange={e => update('sort', e.target.value)}
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      <aside className={`filters ${open ? 'filters--open' : ''}`}>

        {/* Category — DB se active categories */}
        <div className="filter-section">
          <h4>Category</h4>
          <div className="filter-cats">
            <button
              className={`cat-btn ${filters.category === 'all' ? 'active' : ''}`}
              onClick={() => update('category', 'all')}
            >
              <span>🛍️</span> All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-btn ${filters.category === cat.slug ? 'active' : ''}`}
                onClick={() => update('category', cat.slug)}
              >
                <span>{cat.emoji}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className="filter-section">
          <h4>Price Range</h4>
          <div className="price-inputs">
            <input
              type="number" min="0" placeholder="Min"
              value={filters.priceMin}
              onChange={e => update('priceMin', e.target.value)}
            />
            <span>—</span>
            <input
              type="number" min="0" placeholder="Max"
              value={filters.priceMax}
              onChange={e => update('priceMax', e.target.value)}
            />
          </div>
          <div className="price-presets">
            {[
              [0,    500,   'Under ₹500'],
              [500,  1000,  '₹500–₹1000'],
              [1000, 2000,  '₹1000–₹2000'],
              [2000, 99999, '₹2000+'],
            ].map(([min, max, label]) => (
              <button
                key={min}
                className={`preset-btn ${
                  filters.priceMin == min && filters.priceMax == max ? 'active' : ''
                }`}
                onClick={() => onChange({ ...filters, priceMin: min, priceMax: max })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="filter-section">
          <h4>Min Rating</h4>
          <div className="rating-btns">
            {[4, 3.5, 3, 0].map(r => (
              <button
                key={r}
                className={`rating-btn ${filters.rating === r ? 'active' : ''}`}
                onClick={() => update('rating', r)}
              >
                {r === 0 ? 'All' : `${r}★ & above`}
              </button>
            ))}
          </div>
        </div>

        {/* In stock */}
        <div className="filter-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={e => update('inStock', e.target.checked)}
            />
            <span className="toggle-track" />
            In Stock Only
          </label>
        </div>

        {/* Reset */}
        <button
          className="filter-reset"
          onClick={() => onChange({
            category: 'all', sort: 'default',
            priceMin: '', priceMax: '',
            rating: 0, inStock: false,
          })}
        >
          Reset Filters
        </button>
      </aside>
    </>
  );
}