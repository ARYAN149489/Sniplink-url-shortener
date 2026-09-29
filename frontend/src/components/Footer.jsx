import React from 'react';
import { Link } from 'react-router-dom';
import { SiGithub } from 'react-icons/si';
import Logo from './Logo';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="footer-logo-row">
            <Logo size={24} />
            <span className="footer-brand-name">SnipLink</span>
          </div>
          <p className="footer-tagline">
            High-throughput URL redirection and click telemetry engine backed by in-memory caching.
          </p>
          <div className="system-status-indicator">
            <span className="status-ping-dot" />
            <span className="status-text">All systems operational</span>
          </div>
        </div>

        <div className="footer-nav-groups">
          <div className="footer-col">
            <span className="footer-col-title">Platform</span>
            <Link to="/">URL Shortener</Link>
            <Link to="/dashboard">Click Telemetry</Link>
            <Link to="/signup">Developer Account</Link>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">Open Source</span>
            <a
              href="https://github.com/ARYAN149489/Sniplink-url-shortener/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-external-link"
            >
              <SiGithub size={13} />
              <span>Repository</span>
            </a>
            <a
              href="https://github.com/ARYAN149489"
              target="_blank"
              rel="noopener noreferrer"
            >
              Author (@ARYAN149489)
            </a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} SnipLink. Designed and engineered for high-volume redirection.
        </p>
        <div className="footer-built-by">
          <span>Engineered by </span>
          <a
            href="https://github.com/ARYAN149489"
            target="_blank"
            rel="noopener noreferrer"
            className="author-link"
          >
            ARYAN149489
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
