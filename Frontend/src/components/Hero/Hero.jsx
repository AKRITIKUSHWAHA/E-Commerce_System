import React, { useState, useEffect } from 'react';
import { banners } from '../../data/products';
import './Hero.css';

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = banners[active];

  return (
    <section className="hero">
      <div className="hero__slide" style={{ background: current.bg }}>
        <div className="container hero__content">
          <div className="hero__text animate-fade-up" key={active}>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
            <button className="hero__cta">{current.cta} →</button>
          </div>
          <div className="hero__img-wrap">
            <img src={current.image} alt={current.title} />
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="hero__dots">
        {banners.map((_, i) => (
          <button
            key={i}
            className={`hero__dot ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  );
}