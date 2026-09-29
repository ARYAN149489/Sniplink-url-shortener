import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { SiGithub } from 'react-icons/si';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  const getInitials = (name, email) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="navbar-wrapper">
      <nav className="navbar container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <Logo size={30} />
          <span className="brand-name">SnipLink</span>
          <span className="brand-badge">v2.0</span>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        <div className={`navbar-actions ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-nav">
            <NavLink to="/" end onClick={closeMenu} className="nav-item">
              Shortener
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" onClick={closeMenu} className="nav-item">
                Analytics
              </NavLink>
            )}
          </div>

          <div className="navbar-divider" />

          <div className="navbar-auth">
            <a
              href="https://github.com/ARYAN149489/Sniplink-url-shortener/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm github-btn"
              title="GitHub Repository"
            >
              <SiGithub size={16} />
              <span className="github-label">GitHub</span>
            </a>

            {!isAuthenticated ? (
              <>
                <NavLink to="/login" onClick={closeMenu} className="btn btn-ghost btn-sm">
                  Sign In
                </NavLink>
                <NavLink to="/signup" className="btn btn-primary btn-sm" onClick={closeMenu}>
                  Get Started
                </NavLink>
              </>
            ) : (
              <div className="user-dropdown">
                <div className="nav-user-chip">
                  <div className="nav-user-avatar">
                    {getInitials(user?.name, user?.email)}
                  </div>
                  <span className="nav-user-name">
                    {user?.name || user?.email?.split('@')[0] || 'Account'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm logout-btn"
                  title="Sign out"
                >
                  <FiLogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
