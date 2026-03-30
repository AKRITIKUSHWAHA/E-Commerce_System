import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './Hero.css';

// Fallback banners agar DB empty ho
const fallbackBanners = [
  {
    id: 1, title: 'Summer Sale',
    subtitle: 'Up to 80% OFF on Fashion', cta_text: 'Shop Now',
    cta_link: '/home',
    bg_gradient: 'linear-gradient(135deg, #FF3E6C 0%, #FF7043 100%)',
    image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
  },
  {
    id: 2, title: 'New Arrivals',
    subtitle: 'Fresh styles every week', cta_text: 'Explore',
    cta_link: '/home',
    bg_gradient: 'linear-gradient(135deg, #6C63FF 0%, #48C9B0 100%)',
    image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
  },
  {
    id: 3, title: 'Min ₹299 Only',
    subtitle: 'Budget fashion for everyone', cta_text: 'Grab Deals',
    cta_link: '/home',
    bg_gradient: 'linear-gradient(135deg, #FFB400 0%, #FF7043 100%)',
    image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  },
];

export default function Hero() {
  const [active,  setActive]  = useState(0);
  const [banners, setBanners] = useState(fallbackBanners);

  useEffect(() => {
    api.getBanners()
      .then(data => {
        if (data.banners?.length > 0) setBanners(data.banners);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  const current = banners[active] || banners[0];
  if (!current) return null;

  const imgUrl = current.image_url || current.image || '';
  const bg     = current.bg_gradient || current.bg || '#FF3E6C';

  return (
    <section className="hero">
      <div className="hero__slide" style={{ background: bg }}>
        <div className="container hero__content">
          <div className="hero__text animate-fade-up" key={active}>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
            <button
              className="hero__cta"
              onClick={() => current.cta_link && (window.location.href = current.cta_link)}>
              {current.cta_text || 'Shop Now'} →
            </button>
          </div>
          {imgUrl && (
            <div className="hero__img-wrap">
              <img src={imgUrl} alt={current.title}
                onError={e => e.target.style.display='none'} />
            </div>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <div className="hero__dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`hero__dot ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}