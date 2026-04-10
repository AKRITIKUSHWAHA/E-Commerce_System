import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export default function Navbar({ onSearch }) {
  const { totalItems, wishlist } = useCart();
  const { user, logout, openLoginModal } = useAuth(); // ✅ openLoginModal add kiya
  const navigate = useNavigate();

  const [query,      setQuery]      = useState('');
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu,   setUserMenu]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    navigate('/home');
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const clearSearch = () => {
    setQuery('');
    if (onSearch) onSearch('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenu(false);
  };

  // ✅ Login click – modal open karega, /login pe nahi jayega
  const handleLoginClick = (e) => {
    e.preventDefault();
    setMobileMenu(false);
    openLoginModal();
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">

        {/* Logo */}
        <Link to="/home" className="navbar__logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">E-Com<span>merce</span></span>
        </Link>

        {/* Search */}
        <form className="navbar__search" onSubmit={handleSearch}>
          <div className="search-wrap">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search for clothes, man, women and kids...."
              value={query}
              onChange={handleInputChange}
            />
            {query && (
              <button type="button" className="search-clear" onClick={clearSearch}>
                ×
              </button>
            )}
          </div>
        </form>

        {/* Right actions */}
        <div className="navbar__actions">

          {/* Wishlist */}
          <Link to="/wishlist" className="nav-btn" title="Wishlist">
            <HeartIcon />
            {wishlist.length > 0 && (
              <span className="nav-badge">{wishlist.length}</span>
            )}
            <span className="nav-label">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="nav-btn" title="Cart">
            <CartIcon />
            {totalItems > 0 && (
              <span className="nav-badge">{totalItems}</span>
            )}
            <span className="nav-label">Cart</span>
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="nav-user-wrap">
              <button
                className="nav-user-btn"
                onClick={() => setUserMenu(!userMenu)}
              >
                <div className="nav-user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="nav-user-name">
                  {user.name?.split(' ')[0]}
                </span>
                <span className="nav-user-arrow">▾</span>
              </button>

              {userMenu && (
                <>
                  <div className="nav-user-backdrop" onClick={() => setUserMenu(false)} />
                  <div className="nav-user-dropdown">
                    <div className="nav-dropdown-header">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                    <Link to="/account" className="nav-dropdown-item" onClick={() => setUserMenu(false)}>
                      👤 My Account
                    </Link>
                    <Link to="/wishlist" className="nav-dropdown-item" onClick={() => setUserMenu(false)}>
                      ❤️ Wishlist
                    </Link>
                    <Link to="/cart" className="nav-dropdown-item" onClick={() => setUserMenu(false)}>
                      🛒 Cart
                    </Link>
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-logout" onClick={handleLogout}>
                      ⏻ Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ✅ Login button – ab modal open karega */
            <button className="nav-btn nav-login-btn" onClick={handleLoginClick}>
              <span className="nav-label">Login</span>
            </button>
          )}
        </div>

        {/* Hamburger */}
        <button className="navbar__hamburger" onClick={() => setMobileMenu(!mobileMenu)}>
          <MenuIcon />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="navbar__mobile-menu">
          <form onSubmit={handleSearch} style={{ padding: '0 16px 12px' }}>
            <div className="search-wrap">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={handleInputChange}
              />
            </div>
          </form>
          <div className="mobile-links">
            <Link to="/wishlist" onClick={() => setMobileMenu(false)}>
              ❤️ Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
            </Link>
            <Link to="/cart" onClick={() => setMobileMenu(false)}>
              🛒 Cart {totalItems > 0 && `(${totalItems})`}
            </Link>
            {user ? (
              <>
                <Link to="/account" onClick={() => setMobileMenu(false)}>👤 My Account</Link>
                <button onClick={handleLogout}>⏻ Logout</button>
              </>
            ) : (
              /* ✅ Mobile login bhi modal se */
              <button onClick={handleLoginClick}>👤 Login</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
