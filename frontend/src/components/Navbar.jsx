import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
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

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <span className="brand-icon">⚡</span>
        SnipLink
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <li>
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>
        </li>

        {!isAuthenticated ? (
          <>
            <li>
              <NavLink to="/login" onClick={closeMenu}>
                Sign In
              </NavLink>
            </li>
            <li>
              <NavLink to="/signup" className="btn btn-primary btn-sm" onClick={closeMenu}>
                Get Started
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/dashboard" onClick={closeMenu}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <span className="nav-user">
                <FiUser size={14} />
                <span>{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              </span>
            </li>
            <li>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                <FiLogOut size={14} />
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
