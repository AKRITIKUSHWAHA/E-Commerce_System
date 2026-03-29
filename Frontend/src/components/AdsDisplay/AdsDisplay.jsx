import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './AdsDisplay.css';

export default function AdsDisplay({ position = 'home_top' }) {
  const [ads,        setAds]        = useState([]);
  const [popupAd,    setPopupAd]    = useState(null);
  const [showPopup,  setShowPopup]  = useState(false);
  const [dismissed,  setDismissed]  = useState({});

  useEffect(() => {
    api.getAds()
      .then(data => {
        const all = data.ads || [];
        // Position ke hisaab se filter
        const pos = all.filter(a => a.position === position || a.position === 'all_pages');
        setAds(pos);

        // Popup ads
        const popup = all.find(a => a.type === 'popup');
        if (popup) {
          setPopupAd(popup);
          // 2 seconds baad popup dikhao
          setTimeout(() => setShowPopup(true), 2000);
        }
      })
      .catch(() => {});
  }, [position]);

  if (ads.length === 0) return null;

  return (
    <>
      {/* Banner Ads */}
      {ads.filter(a => a.type === 'banner' && !dismissed[a.id]).map(ad => (
        <div key={ad.id} className="ad-banner"
          style={{ background: ad.bg_color || '#FF3E6C', color: ad.text_color || '#fff' }}>
          {ad.image_url && (
            <img src={ad.image_url} alt={ad.title} className="ad-banner__img" />
          )}
          <div className="ad-banner__content">
            {ad.title && <strong className="ad-banner__title">{ad.title}</strong>}
            {ad.description && <span className="ad-banner__desc">{ad.description}</span>}
            {ad.link_url && (
              <a href={ad.link_url} className="ad-banner__btn"
                style={{ color: ad.bg_color || '#FF3E6C' }}
                target="_blank" rel="noreferrer">
                Shop Now →
              </a>
            )}
          </div>
          <button className="ad-banner__close"
            onClick={() => setDismissed(d => ({ ...d, [ad.id]: true }))}>
            ✕
          </button>
        </div>
      ))}

      {/* Text Ads */}
      {ads.filter(a => a.type === 'text' && !dismissed[a.id]).map(ad => (
        <div key={ad.id} className="ad-text"
          style={{ background: ad.bg_color || '#FF3E6C', color: ad.text_color || '#fff' }}>
          <span>📢</span>
          <span className="ad-text__msg">
            {ad.title && <strong>{ad.title} </strong>}
            {ad.description}
          </span>
          {ad.link_url && (
            <a href={ad.link_url} className="ad-text__link" target="_blank" rel="noreferrer">
              Learn More →
            </a>
          )}
          <button className="ad-text__close"
            onClick={() => setDismissed(d => ({ ...d, [ad.id]: true }))}>
            ✕
          </button>
        </div>
      ))}

      {/* Popup Ad */}
      {showPopup && popupAd && !dismissed[popupAd.id] && (
        <div className="ad-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="ad-popup" onClick={e => e.stopPropagation()}
            style={{ background: popupAd.bg_color || '#FF3E6C' }}>
            <button className="ad-popup__close"
              onClick={() => { setShowPopup(false); setDismissed(d => ({ ...d, [popupAd.id]: true })); }}>
              ✕
            </button>
            {popupAd.image_url && (
              <img src={popupAd.image_url} alt={popupAd.title} className="ad-popup__img" />
            )}
            <div className="ad-popup__content"
              style={{ color: popupAd.text_color || '#fff' }}>
              {popupAd.title && <h2>{popupAd.title}</h2>}
              {popupAd.description && <p>{popupAd.description}</p>}
              {popupAd.link_url && (
                <a href={popupAd.link_url} className="ad-popup__btn"
                  target="_blank" rel="noreferrer">
                  Shop Now →
                </a>
              )}
              <button className="ad-popup__dismiss"
                onClick={() => { setShowPopup(false); setDismissed(d => ({ ...d, [popupAd.id]: true })); }}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}