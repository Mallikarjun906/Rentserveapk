import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, logoutSession, readUser } from '../services/api';

export default function Layout({ children }) {
  const user = readUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await logoutSession();
    navigate('/login', { replace: true });
    window.location.reload();
  };

  const closeMenu = () => setMenuOpen(false);

  const role = user?.role;
  const isProvider = role === 'provider';
  const isDriver = role === 'driver';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';

  const brandLink = isAdmin
    ? '/admin'
    : isProvider
    ? '/provider/dashboard'
    : isDriver
    ? '/driver/dashboard'
    : isStudent
    ? '/student/dashboard'
    : isOwner
    ? '/owner/dashboard'
    : '/';

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <div className="nav wrap">
          <Link to={brandLink} className="brand" onClick={closeMenu}>
            <span className="brand-mark">N</span>
            <span>
              <span className="brand-name">
                NUK <b>RentServe</b>
              </span>
              <small>YOUR PLACE. YOUR PEOPLE.</small>
            </span>
          </Link>

          <button
            className="mobile-menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {/* 1. Provider Navigation */}
            {isProvider && (
              <>
                <NavLink to="/provider/dashboard" onClick={closeMenu}>
                  Provider Dashboard
                </NavLink>
                <NavLink to="/provider/contact-support" onClick={closeMenu}>
                  Contact Support
                </NavLink>
                <button className="nav-logout" onClick={logout}>
                  Log out ({user.name})
                </button>
              </>
            )}

            {/* 2. Driver Navigation */}
            {isDriver && (
              <>
                <NavLink to="/driver/dashboard" onClick={closeMenu}>
                  Driver Dashboard
                </NavLink>
                <NavLink to="/transport" onClick={closeMenu}>
                  Transport Requests
                </NavLink>
                <button className="nav-logout" onClick={logout}>
                  Log out ({user.name})
                </button>
              </>
            )}

            {/* 3. Student Navigation */}
            {isStudent && (
              <>
                <NavLink to="/student/dashboard" onClick={closeMenu}>
                  Student Dashboard
                </NavLink>
                <NavLink to="/rentals" onClick={closeMenu}>
                  Rentals & PGs
                </NavLink>
                <button className="nav-logout" onClick={logout}>
                  Log out ({user.name})
                </button>
              </>
            )}

            {/* 4. Admin Navigation */}
            {isAdmin && (
              <>
                <NavLink to="/admin" onClick={closeMenu}>
                  Admin Console
                </NavLink>
                <NavLink to="/rentals" onClick={closeMenu}>
                  Rentals
                </NavLink>
                <NavLink to="/services" onClick={closeMenu}>
                  Services
                </NavLink>
                <NavLink to="/transport" onClick={closeMenu}>
                  Transport
                </NavLink>
                <button className="nav-logout" onClick={logout}>
                  Admin Log out
                </button>
              </>
            )}

            {/* 5. Customer / Property Owner / Guest Navigation */}
            {!isProvider && !isDriver && !isStudent && !isAdmin && (
              <>
                <NavLink to="/" end onClick={closeMenu}>
                  Home
                </NavLink>
                <NavLink to="/rentals" onClick={closeMenu}>
                  Rentals
                </NavLink>
                <NavLink to="/services" onClick={closeMenu}>
                  Services
                </NavLink>
                <NavLink to="/transport" onClick={closeMenu}>
                  Transport
                </NavLink>
                <NavLink to="/contact" onClick={closeMenu}>
                  Support
                </NavLink>

                {user ? (
                  <>
                    <NavLink to="/enquiries" onClick={closeMenu}>
                      Enquiries
                    </NavLink>
                    <NavLink to="/dashboard" onClick={closeMenu}>
                      Dashboard
                    </NavLink>
                    <button className="nav-logout" onClick={logout}>
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/register" onClick={closeMenu}>
                      Join
                    </NavLink>
                    <NavLink to="/login" onClick={closeMenu}>
                      Log in
                    </NavLink>
                    <Link className="btn btn-small" to="/register" onClick={closeMenu}>
                      Get started <span>↗</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="footer">
        <div className="wrap footer-main">
          <div className="footer-about">
            <Link to="/" className="brand footer-brand">
              <span className="brand-mark">N</span>
              <span>
                <span className="brand-name">
                  NUK <b>RentServe</b>
                </span>
                <small>YOUR PLACE. YOUR PEOPLE.</small>
              </span>
            </Link>
            <p>
              Direct rental properties, verified service professionals and community transport across Karnataka. 0% platform retention.
            </p>
            <span className="footer-kannada">ನಿಮ್ಮ ಊರು, ನಿಮ್ಮ ಸೇವೆ!</span>
          </div>

          <div className="footer-col">
            <b>Explore & Services</b>
            <Link to="/rentals">Rentals & PGs</Link>
            <Link to="/services">Local Trades & Services</Link>
            <Link to="/transport">Auto, Car & Goods Transport</Link>
            <Link to="/contact">Help Desk & Support</Link>
          </div>

          <div className="footer-col">
            <b>Register Roles</b>
            <Link to="/register/customer">Customer Registration</Link>
            <Link to="/register/provider">Service Provider Registration</Link>
            <Link to="/register/driver">Driver & Fleet Onboarding</Link>
            <Link to="/register/student">Student Partner Registration</Link>
          </div>

          <div className="footer-col">
            <b>Role Sign In</b>
            <Link to="/login">Customer Login</Link>
            <Link to="/provider/login">Service Provider Login</Link>
            <Link to="/driver/login">Transport Driver Login</Link>
            <Link to="/student/login">Student Partner Login</Link>
            <Link to="/admin/login" style={{ color: 'var(--red)', fontWeight: 700 }}>Administrator Portal</Link>
          </div>
        </div>

        <div className="wrap footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span>© {new Date().getFullYear()} NUK RentServe · Built for Communities Across Karnataka</span>
          <span>Security & Role-Based Access Enforced · v2.1</span>
        </div>
      </footer>
    </>
  );
}
