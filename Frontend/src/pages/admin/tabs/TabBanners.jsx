import React from 'react';
import { api } from '../../../services/api';
import BannerModal from '../modals/BannerModal';

export default function TabBanners({ banners, setBanners, flash, showBannerModal, setShowBannerModal, editBanner, setEditBanner }) {

  // Banner image click → open cta_link
  const handleImageClick = (banner) => {
    if (!banner.cta_link) return;
    if (banner.cta_link.startsWith('http')) {
      window.open(banner.cta_link, '_blank');
    } else {
      window.open(banner.cta_link, '_self');
    }
  };

  return (
    <div className="adm-content">
      <div className="adm-search-bar">
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>🖼️ Hero Banners</h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Take control of your homepage sliding Banners
          </p>
        </div>
        <button className="adm-btn-primary"
          onClick={() => { setEditBanner(null); setShowBannerModal(true); }}>
          + Add Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="adm-empty"><span>🖼️</span><p>No banners yet. Add your first hero banner!</p></div>
      ) : (
        <div className="adm-banners-list">
          {banners.map((b, idx) => (
            <div key={b.id} className={`adm-banner-card ${b.is_active ? '' : 'inactive'}`}>

              <div className="adm-banner-preview" style={{ background: b.bg_gradient }}>

                {/* Text side */}
                <div className="adm-banner-preview__text">
                  <strong>{b.title}</strong>
                  <span>{b.subtitle}</span>
                  <div className="adm-banner-cta">{b.cta_text} →</div>
                </div>

                {/* ── Image with camera icon ── */}
                {b.image_url ? (
                  <div
                    className="adm-banner-img-wrap"
                    onClick={() => handleImageClick(b)}
                    title={b.cta_link ? `Go to: ${b.cta_link}` : 'No link set'}
                  >
                    <img
                      src={b.image_url}
                      alt={b.title}
                      onError={e => e.target.parentElement.style.display = 'none'}
                    />
                    {/* Camera + redirect overlay */}
                    <div className="adm-banner-img-overlay">
                      <span className="adm-banner-img-camera">📷</span>
                      {b.cta_link
                        ? <span className="adm-banner-img-hint">Click to preview</span>
                        : <span className="adm-banner-img-hint" style={{ color: '#ffcdd2' }}>No link</span>
                      }
                    </div>
                  </div>
                ) : (
                  /* No image — camera placeholder */
                  <div
                    className="adm-banner-img-placeholder"
                    onClick={() => { setEditBanner(b); setShowBannerModal(true); }}
                    title="Click to add image"
                  >
                    <span>📷</span>
                    <small>Add Image</small>
                  </div>
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
  );
}
