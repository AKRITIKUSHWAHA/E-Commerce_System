import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './ProductCard.css';

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const CartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const ShopIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
  </svg>
);

function getDiscount(price, originalPrice) {
  return Math.round((1 - price / originalPrice) * 100);
}

function normalizeTagClass(tag) {
  const t = tag.toLowerCase().trim();
  if (t.includes('trending'))                                  return 'trending';
  if (t.includes('new sale') || t === 'new sale')              return 'new-sale';
  if (t.includes('new tranding') || t.includes('new tranding')) return 'new-trending';
  if (t.includes('sale'))                                      return 'sale';
  if (t.includes('bestseller') || t.includes('best seller'))   return 'bestseller';
  if (t.includes('hot'))                                       return 'hot';
  if (t.includes('featured'))                                  return 'featured';
  if (t.includes('new'))                                       return 'new';
  return t.replace(/\s+/g, '-');
}

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className="star full">★</span>);
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<span key={i} className="star half">★</span>);
    } else {
      stars.push(<span key={i} className="star empty">★</span>);
    }
  }
  return <div className="star-row">{stars}</div>;
}

export default function ProductCard({ product }) {
  const { dispatch, wishlist } = useCart();
  const { user, openLoginModal } = useAuth(); // ✅ openLoginModal add kiya
  const navigate   = useNavigate();
  const [added,    setAdded]    = useState(false);
  const [imgErr,   setImgErr]   = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const isWishlisted = wishlist.includes(product.id);
  const discount     = getDiscount(product.price, product.originalPrice);
  const images       = product.images?.length > 0 ? product.images : (product.image ? [product.image] : []);
  const activeImg    = images[imgIndex] || product.image || '';
  const rating       = parseFloat(product.rating) || 0;

  const productPath = product.slug
    ? `/product/${product.slug}`
    : `/product/${product.id}`;

  const prevImg = (e) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i - 1 + images.length) % images.length);
  };
  const nextImg = (e) => {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i + 1) % images.length);
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!product.inStock) return;
    if (!user) { openLoginModal(); return; } // ✅ modal
    dispatch({ type: 'ADD_TO_CART', payload: product });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleShopNow = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { openLoginModal(); return; } // ✅ modal
    navigate(productPath);
  };

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { openLoginModal(); return; } // ✅ modal
    dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id });
  };

  return (
    <Link to={productPath} className="product-card">

      <div className="product-card__img-wrap">
        {!imgErr ? (
          <img src={activeImg} alt={product.name}
            onError={() => setImgErr(true)} loading="lazy" />
        ) : (
          <div className="product-card__img-fallback">🛍️</div>
        )}

        {images.length > 1 && (
          <>
            <button className="pc-arrow pc-arrow--left" onClick={prevImg}>‹</button>
            <button className="pc-arrow pc-arrow--right" onClick={nextImg}>›</button>
            <div className="pc-dots">
              {images.map((_, i) => (
                <span key={i}
                  className={`pc-dot ${imgIndex === i ? 'active' : ''}`}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }} />
              ))}
            </div>
          </>
        )}

        <button
          className={`product-card__wish ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <HeartIcon filled={isWishlisted} />
        </button>

        {discount > 0 && (
          <span className="product-card__discount">{discount}% OFF</span>
        )}

        {!product.inStock && (
          <div className="product-card__oos">Out of Stock</div>
        )}

        {product.inStock && product.stock > 0 && product.stock <= 5 && (
          <div className="product-card__low-stock">Only {product.stock} left!</div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="product-card__tags">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className={`p-tag p-tag--${normalizeTagClass(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="product-card__info">
        <p className="product-card__brand">{product.brand}</p>
        <h3 className="product-card__name">{product.name}</h3>

        {rating > 0 ? (
          <div className="product-card__rating">
            <StarRating rating={rating} />
            <span className="rating-num">{rating.toFixed(1)}</span>
            {product.ratingCount > 0 && (
              <span className="rating-count">({product.ratingCount.toLocaleString()})</span>
            )}
          </div>
        ) : (
          <div className="product-card__rating no-rating">
            <StarRating rating={0} />
            <span className="rating-count">No reviews yet</span>
          </div>
        )}

        <div className="product-card__price-row">
          <span className="price-now">₹{product.price.toLocaleString()}</span>
          {product.originalPrice > product.price && (
            <span className="price-old">₹{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        {product.inStock ? (
          <div className={`product-card__stock ${product.stock <= 5 ? 'low' : ''}`}>
            {product.stock <= 5 ? `⚠️ Only ${product.stock} left!` : `✓ In Stock`}
          </div>
        ) : (
          <div className="product-card__stock out">✗ Out of Stock</div>
        )}

        {product.colors && product.colors.length > 1 && (
          <div className="product-card__colors">
            {product.colors.slice(0, 4).map((c, i) => (
              <span key={i} className="color-dot" style={{ background: c }} title={c} />
            ))}
            {product.colors.length > 4 && (
              <span className="color-more">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="product-card__btns">
          <button
            className={`product-card__cart-btn ${added ? 'added' : ''} ${!product.inStock ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            {added ? <><span>✓</span> Added!</> : <><CartIcon /> Add to Cart</>}
          </button>
          <button className="product-card__shop-btn" onClick={handleShopNow}>
            <ShopIcon /> Shop Now
          </button>
        </div>
      </div>
    </Link>
  );
}
