import React from 'react';
import { api } from '../../../services/api';
import AdModal from '../modals/AdModal';

export default function TabAds({ ads, setAds, flash, showAdModal, setShowAdModal, editAd, setEditAd }) {

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Image click → open link in new tab (ya same tab)
  const handleImageClick = (ad) => {
    if (!ad.link_url) return;
    if (ad.link_url.startsWith('http')) {
      window.open(ad.link_url, '_blank');
    } else {
      window.open(ad.link_url, '_self');
    }
  };

  return (
    <div className="adm-content">
      <div className="adm-search-bar">
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>📢 Ads Management</h3>
        <button className="adm-btn-primary"
          onClick={() => { setEditAd(null); setShowAdModal(true); }}>
          + Create Ad
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="adm-empty"><span>📢</span><p>No ads yet. Create your first ad!</p></div>
      ) : (
        <div className="adm-ads-list">
          {ads.map(ad => (
            <div key={ad.id} className={`adm-ad-card ${ad.is_active ? 'active' : 'inactive'}`}>

              <div className="adm-ad-preview"
                style={{ background: ad.bg_color || '#FF3E6C', color: ad.text_color || '#fff' }}>

                {/* ── Image with camera icon ── */}
                {ad.image_url ? (
                  <div
                    className="adm-ad-img-wrap"
                    onClick={() => handleImageClick(ad)}
                    title={ad.link_url ? `Go to: ${ad.link_url}` : 'No link set'}
                  >
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      onError={e => e.target.parentElement.style.display = 'none'}
                    />
                    {/* Camera icon overlay */}
                    <div className="adm-ad-img-overlay">
                      <span className="adm-ad-img-camera">📷</span>
                      {ad.link_url
                        ? <span className="adm-ad-img-hint">Click to open link</span>
                        : <span className="adm-ad-img-hint" style={{ color: '#ffcdd2' }}>No link set</span>
                      }
                    </div>
                  </div>
                ) : (
                  /* No image — show camera placeholder to prompt adding one */
                  <div
                    className="adm-ad-img-placeholder"
                    onClick={() => { setEditAd(ad); setShowAdModal(true); }}
                    title="Click to add image"
                  >
                    <span>📷</span>
                    <small>Add Image</small>
                  </div>
                )}

                <div className="adm-ad-preview__text">
                  <strong>{ad.title || 'No Title'}</strong>
                  <span>{ad.description || ''}</span>
                  {ad.link_url && (
                    <span className="adm-ad-link-tag">🔗 {ad.link_url}</span>
                  )}
                </div>
                <span className="adm-ad-type-badge">{ad.type}</span>
              </div>

              <div className="adm-ad-info">
                <div className="adm-ad-meta">
                  <span className="adm-ad-pos">📍 {ad.position}</span>
                  {ad.start_date && <span>From: {formatDate(ad.start_date)}</span>}
                  {ad.end_date   && <span>To: {formatDate(ad.end_date)}</span>}
                  <span style={{ fontWeight: 600, color: ad.is_active ? '#0A7D56' : '#C62828' }}>
                    {ad.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div className="adm-ad-actions">
                  <button
                    className={ad.is_active ? 'adm-btn-stock-out' : 'adm-btn-stock-in'}
                    onClick={async () => {
                      await api.toggleAd(ad.id);
                      setAds(prev => prev.map(a =>
                        a.id === ad.id ? { ...a, is_active: a.is_active ? 0 : 1 } : a
                      ));
                      flash(ad.is_active ? 'Ad deactivated' : 'Ad activated');
                    }}>
                    {ad.is_active ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button className="adm-btn-edit"
                    onClick={() => { setEditAd(ad); setShowAdModal(true); }}>
                    ✏️ Edit
                  </button>
                  <button className="adm-btn-delete"
                    onClick={async () => {
                      if (!window.confirm('Delete this ad?')) return;
                      await api.deleteAd(ad.id);
                      setAds(prev => prev.filter(a => a.id !== ad.id));
                      flash('Ad deleted');
                    }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdModal && (
        <AdModal
          ad={editAd}
          onClose={() => { setShowAdModal(false); setEditAd(null); }}
          onSaved={async () => {
            setShowAdModal(false); setEditAd(null);
            const data = await api.getAdminAds();
            setAds(data.ads || []);
            flash('Ad saved!');
          }}
        />
      )}
    </div>
  );
}
