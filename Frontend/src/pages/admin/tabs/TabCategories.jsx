import React from 'react';
import { api } from '../../../services/api';

export default function TabCategories({ categories, setCategories, flash }) {
  const handleToggle = async (cat) => {
    try {
      await api.toggleCategory(cat.id);
      setCategories(prev => prev.map(c =>
        c.id === cat.id ? { ...c, is_active: c.is_active ? 0 : 1 } : c
      ));
      flash(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) { flash(err.message, true); }
  };

  return (
    <div className="adm-content">
      <div className="adm-cat-info">
        💡 Active categories are visible on the user's home page — toggle to show/hide them
      </div>
      <div className="adm-cat-grid">
        {categories.map(c => (
          <div key={c.id} className={`adm-cat-card ${c.is_active ? 'cat-active' : 'cat-inactive'}`}>
            <button className={`adm-cat-toggle-btn ${c.is_active ? 'on' : 'off'}`}
              onClick={() => handleToggle(c)}>
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
  );
}
