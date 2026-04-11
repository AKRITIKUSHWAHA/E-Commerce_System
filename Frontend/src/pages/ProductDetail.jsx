import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard/ProductCard';
import './ProductDetail.css';

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? '#FFB400' : 'none'}
    stroke="#FFB400" strokeWidth="1.5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const getImgUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `http://localhost:5000${img}`;
};

function normalizeProduct(p) {
  return {
    id:            p.id,
    name:          p.name,
    brand:         p.brand          || '',
    price:         Number(p.price),
    originalPrice: Number(p.original_price),
    rating:        parseFloat(p.avg_rating)   || 0,
    ratingCount:   Number(p.rating_count) || 0,
    image:         p.images?.[0]          || '',
    images:        p.images               || [],
    colors:        p.colors               || [],
    sizes:         p.sizes                || [],
    tags:          p.tags                 || [],
    inStock:       p.stock > 0,
    stock:         p.stock,
    category:      p.category_slug        || '',
    category_name: p.category_name        || '',
    description:    p.description          || '',
    non_returnable: Number(p.has_disclaimer) === 1, // ✅ DB se 0/1 aata hai
    has_disclaimer: p.has_disclaimer, // ✅ raw value bhi pass karo
  };
}

export default function ProductDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { dispatch, wishlist } = useCart();
  const { user, openLoginModal } = useAuth(); // ✅ openLoginModal add kiya

  const [product,       setProduct]       = useState(null);
  const [related,       setRelated]       = useState([]);
  const [reviews,       setReviews]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedImg,   setSelectedImg]   = useState(0);
  const [selectedSize,  setSelectedSize]  = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [added,         setAdded]         = useState(false);
  const [sizeError,     setSizeError]     = useState('');
  const [quantity,      setQuantity]      = useState(1);

  const [myRating,   setMyRating]   = useState(0);
  const [hoverStar,  setHoverStar]  = useState(0);
  const [myComment,  setMyComment]  = useState('');
  const [reviewMsg,  setReviewMsg]  = useState('');
  const [reviewErr,  setReviewErr]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setSelectedImg(0);
    setSelectedSize('');
    setSizeError('');
    try {
      const data = await api.getProduct(id);
      const p = normalizeProduct(data.product);
      setProduct(p);

      try {
        const revData = await api.getReviews(id);
        setReviews(revData.reviews || []);
      } catch (e) { setReviews([]); }

      const rel = await api.getProducts({ category: p.category });
      setRelated(
        (rel.products || [])
          .filter(rp => rp.id !== p.id)
          .slice(0, 4)
          .map(normalizeProduct)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) { openLoginModal(); return; } // ✅ modal
    if (!myRating) { setReviewErr('Please select a star rating'); return; }
    setSubmitting(true);
    setReviewErr('');
    setReviewMsg('');
    try {
      await api.addReview(id, { rating: myRating, comment: myComment });
      setReviewMsg('Review submitted successfully!');
      setMyRating(0);
      setMyComment('');
      const revData = await api.getReviews(id);
      setReviews(revData.reviews || []);
      const data = await api.getProduct(id);
      setProduct(normalizeProduct(data.product));
    } catch (err) {
      setReviewErr(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) { openLoginModal(); return; } // ✅ modal
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError('Please select your size');
      return;
    }
    setSizeError('');
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        selectedSize,
        selectedColor: product.colors?.[selectedColor],
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShopNow = () => {
    if (!user) { openLoginModal(); return; } // ✅ modal
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError('Please select your size');
      return;
    }
    setSizeError('');
    navigate('/checkout', {
      state: {
        product: {
          ...product,
          has_disclaimer: product.has_disclaimer, // ✅ explicitly pass karo
        },
        selectedSize,
        selectedColor: product.colors?.[selectedColor],
        quantity,
      },
    });
  };

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-skeleton-grid">
          <div className="skeleton pd-skeleton-img" />
          <div className="pd-skeleton-info">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`skeleton pd-skeleton-line ${i === 0 ? 'short' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found container">
        <h2>Product not found</h2>
        <Link to="/">← Go back to Home</Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);
  const discount     = Math.round((1 - product.price / product.originalPrice) * 100);
  const activeImg    = getImgUrl(product.images?.[selectedImg] || product.image);

  const ratingLabel = (r) => {
    if (r === 1) return 'Poor';
    if (r === 2) return 'Fair';
    if (r === 3) return 'Good';
    if (r === 4) return 'Very Good';
    if (r === 5) return 'Excellent';
    return 'Select rating';
  };

  return (
    <div className="product-detail container">

      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <span className="breadcrumb-cat">{product.category_name}</span>
        <span>›</span>
        <span>{product.name}</span>
      </nav>

      <div className="detail-grid">

        {/* ── Image column ── */}
        <div className="detail-img-col">
          <div className="detail-img-slider">
            <div className="detail-img-wrap">
              {activeImg ? (
                <img src={activeImg} alt={product.name}
                  onError={e => e.target.style.display = 'none'} />
              ) : (
                <div className="detail-img-fallback">🛍️</div>
              )}
              {discount >= 20 && (
                <span className="detail-discount">{discount}% OFF</span>
              )}
              {!product.inStock && (
                <div className="detail-oos">Out of Stock</div>
              )}
            </div>

            {product.images?.length > 1 && (
              <>
                <button className="detail-img-arrow left"
                  onClick={() => setSelectedImg(i => (i - 1 + product.images.length) % product.images.length)}>
                  ‹
                </button>
                <button className="detail-img-arrow right"
                  onClick={() => setSelectedImg(i => (i + 1) % product.images.length)}>
                  ›
                </button>
                <div className="detail-img-dots">
                  {product.images.map((_, i) => (
                    <button key={i}
                      className={`detail-img-dot ${selectedImg === i ? 'active' : ''}`}
                      onClick={() => setSelectedImg(i)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {product.images?.length > 1 && (
            <div className="detail-thumbs">
              {product.images.map((img, i) => (
                <img key={i} src={getImgUrl(img)} alt={`${product.name} ${i + 1}`}
                  className={`detail-thumb ${selectedImg === i ? 'active' : ''}`}
                  onClick={() => setSelectedImg(i)}
                  onError={e => e.target.style.display = 'none'} />
              ))}
            </div>
          )}
          {/* ── Reviews – image ke neeche ── */}
          <div className="reviews-section">
            <h2>
              Customer Reviews
              {reviews.length > 0 && (
                <span className="reviews-count">({reviews.length})</span>
              )}
            </h2>

            <div className="review-form-card">
              <h3>Write a Review</h3>
              {!user ? (
                <p className="review-login-msg">
                  <button
                    onClick={openLoginModal}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--primary)', fontWeight: 600, padding: 0,
                      fontSize: 'inherit', textDecoration: 'underline',
                    }}
                  >Login</button>{' '}
                  to write a review
                </p>
              ) : (
                <>
                  <div className="review-stars-select">
                    {[1,2,3,4,5].map(n => (
                      <span key={n}
                        className={`review-star-btn ${n <= (hoverStar || myRating) ? 'filled' : ''}`}
                        onClick={() => setMyRating(n)}
                        onMouseEnter={() => setHoverStar(n)}
                        onMouseLeave={() => setHoverStar(0)}
                      >★</span>
                    ))}
                    <span className="review-star-label">{ratingLabel(hoverStar || myRating)}</span>
                  </div>
                  <textarea
                    className="review-comment"
                    placeholder="Share your experience with this product... (optional)"
                    value={myComment}
                    onChange={e => setMyComment(e.target.value)}
                    rows={3}
                  />
                  {reviewErr && <div className="review-error">⚠️ {reviewErr}</div>}
                  {reviewMsg && <div className="review-success">✅ {reviewMsg}</div>}
                  <button className="review-submit-btn" onClick={handleSubmitReview} disabled={submitting}>
                    {submitting ? 'Submitting...' : '⭐ Submit Review'}
                  </button>
                </>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="no-reviews"><p>No reviews yet. Be the first to review!</p></div>
            ) : (
              <div className="reviews-list">
                {reviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-card__header">
                      <div className="review-avatar">
                        {(r.reviewer_name || r.user_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{r.reviewer_name || r.user_name || 'User'}</strong>
                        <div className="review-stars">
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className={n <= r.rating ? 'star filled' : 'star'}>★</span>
                          ))}
                        </div>
                      </div>
                      <span className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    {r.comment && <p className="review-comment-text">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Info column ── */}
        <div className="detail-info-col">

          <div className="detail-tags">
            {product.tags?.map(t => (
              <span key={t} className={`p-tag p-tag--${t.toLowerCase().replace(/\s+/g, '-')}`}>
                {t}
              </span>
            ))}
          </div>

          <p className="detail-brand">{product.brand}</p>
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-rating">
            <div className="stars-row">
              {[1,2,3,4,5].map(n => (
                <StarIcon key={n} filled={n <= Math.round(product.rating)} />
              ))}
            </div>
            <span className="rating-num">{product.rating.toFixed(1)}</span>
            <span className="rating-cnt">
              ({product.ratingCount?.toLocaleString()} rating{product.ratingCount !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="detail-price-row">
            <span className="detail-price">₹{product.price.toLocaleString()}</span>
            <span className="detail-orig">₹{product.originalPrice.toLocaleString()}</span>
            {discount >= 20 && <span className="detail-savings">{discount}% off</span>}
          </div>

          <div className={`detail-stock ${product.inStock ? 'in' : 'out'}`}>
            {product.inStock
              ? `✓ In Stock (${product.stock} available)`
              : '✗ Out of Stock'}
          </div>

          {product.colors?.length > 0 && (
            <div className="detail-section">
              <h3>Color</h3>
              <div className="detail-colors">
                {product.colors.map((c, i) => (
                  <button key={i}
                    className={`color-circle ${selectedColor === i ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setSelectedColor(i)}
                    title={c} />
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="detail-section">
              <h3>
                Size {selectedSize && <span className="selected-size">— {selectedSize}</span>}
              </h3>
              <div className="detail-sizes">
                {product.sizes.map(s => (
                  <button key={s}
                    className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => { setSelectedSize(s); setSizeError(''); }}>
                    {s}
                  </button>
                ))}
              </div>
              {sizeError && <p className="size-error">⚠️ {sizeError}</p>}
            </div>
          )}

          <div className="detail-section">
            <h3>Quantity</h3>
            <div className="detail-qty">
              <button className="detail-qty__btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}>−</button>
              <span className="detail-qty__num">{quantity}</span>
              <button className="detail-qty__btn"
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}>+</button>
              <span className="detail-qty__stock">{product.stock} available</span>
            </div>
          </div>

          <div className="detail-actions">
            <button
              className={`detail-add-btn ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {added ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
            <button
              className="detail-shop-btn"
              onClick={handleShopNow}
              disabled={!product.inStock}
            >
              ⚡ Shop Now
            </button>
            <button
              className={`detail-wish-btn ${isWishlisted ? 'active' : ''}`}
              onClick={() => {
                if (!user) { openLoginModal(); return; } // ✅ modal
                dispatch({ type: 'TOGGLE_WISHLIST', payload: product.id });
              }}
            >
              {isWishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          {product.description && (
            <div className="detail-desc">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="detail-highlights">
            {[
              { icon: '🚚', title: 'Free Delivery',   sub: 'On orders above ₹999' },
              { icon: '✅', title: 'Genuine Product', sub: '100% authentic guaranteed' },
            ].map(h => (
              <div className="highlight" key={h.title}>
                <span>{h.icon}</span>
                <div><strong>{h.title}</strong><p>{h.sub}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="related-section">
          <h2>Similar Products</h2>
          <div className="grid-products">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

    </div>
  );
}
