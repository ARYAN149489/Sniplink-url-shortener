import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import {
  FiLink, FiZap, FiBarChart2, FiGrid, FiShield, FiLink2, FiClock,
  FiCopy, FiCheck, FiArrowRight,
} from 'react-icons/fi';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState([]);
  const resultRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadRecentLinks();
    }
  }, [isAuthenticated]);

  const loadRecentLinks = async () => {
    try {
      const data = await api.get('/url/my-links?limit=5');
      setRecentLinks(data.urls);
    } catch (error) {
      console.error('Failed to load recent links:', error);
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a URL to shorten.');
      return;
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl);
    }

    setLoading(true);
    try {
      const body = { originalUrl: formattedUrl };
      if (alias.trim()) body.customAlias = alias.trim();
      if (expires) body.expiresIn = expires;

      const data = await api.post('/url/shorten', body);
      setResult(data.url);
      toast.success('URL shortened successfully!');
      setUrl('');
      setAlias('');

      if (isAuthenticated) loadRecentLinks();

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const features = [
    { icon: <FiZap size={24} />, title: 'Lightning Fast', desc: 'URLs shortened in milliseconds. No rate limits, no waiting. Just paste and go.' },
    { icon: <FiBarChart2 size={24} />, title: 'Rich Analytics', desc: 'Track clicks in real-time. See browser, device, location, and referrer data at a glance.' },
    { icon: <FiGrid size={24} />, title: 'QR Codes', desc: 'Instant QR code generation for every link. Perfect for print, events, and sharing.' },
    { icon: <FiShield size={24} />, title: 'Secure & Private', desc: 'JWT authentication, encrypted passwords, and your data stays yours. Always.' },
    { icon: <FiLink2 size={24} />, title: 'Custom Aliases', desc: 'Choose your own branded short links. Make URLs memorable and professional.' },
    { icon: <FiClock size={24} />, title: 'Link Expiration', desc: 'Set links to expire after a specific time. Perfect for temporary campaigns and events.' },
  ];

  return (
    <main className="page-content">
      {/* Hero Section */}
      <section className="hero container">
        <h1 className="animate-slide-up">
          Shorten Links,<br />
          <span className="gradient-text">Amplify Your Reach</span>
        </h1>
        <p className="subtitle animate-slide-up stagger-1">
          Transform long URLs into sleek, trackable links. Get real-time click analytics,
          QR codes, and powerful insights — all for free.
        </p>

        {/* Shortener Form */}
        <div className="shortener-section animate-slide-up stagger-2">
          <form onSubmit={handleShorten}>
            <div className="url-input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-label="URL to shorten"
                autoComplete="off"
                required
              />
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Shortening...</>
                ) : (
                  <><FiLink size={18} /> Shorten URL</>
                )}
              </button>
            </div>

            <div className="options-row">
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Custom alias (optional)"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  aria-label="Custom alias"
                />
              </div>
              <div className="form-group">
                <select
                  className="form-select"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  aria-label="Expiration"
                >
                  <option value="">Never expires</option>
                  <option value="1">Expires in 1 day</option>
                  <option value="7">Expires in 7 days</option>
                  <option value="30">Expires in 30 days</option>
                  <option value="90">Expires in 90 days</option>
                  <option value="365">Expires in 1 year</option>
                </select>
              </div>
            </div>
          </form>

          {/* Result Card */}
          {result && (
            <div className="card card-glow result-card" ref={resultRef}>
              <div className="result-url">
                <div>
                  <a
                    href={result.shortUrl}
                    className="short-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.shortUrl}
                  </a>
                  <div className="original-link">{result.originalUrl}</div>
                </div>
              </div>
              <div className="result-bottom">
                <div className="result-actions">
                  <button
                    className={`btn btn-secondary btn-sm copy-btn ${copied ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(result.shortUrl)}
                  >
                    {copied ? <><FiCheck size={16} /> Copied!</> : <><FiCopy size={16} /> Copy Link</>}
                  </button>
                </div>
                <div className="qr-container">
                  <QRCodeSVG
                    value={result.shortUrl}
                    size={120}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                    level="M"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Links */}
      {isAuthenticated && recentLinks.length > 0 && (
        <section className="container recent-links-section">
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Your Recent Links</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Short Link</th>
                    <th>Original URL</th>
                    <th>Clicks</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLinks.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="table-link">
                          {link.customAlias || link.shortCode}
                        </a>
                      </td>
                      <td className="table-url" title={link.originalUrl}>{link.originalUrl}</td>
                      <td>{link.clicks}</td>
                      <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="features-section container">
        <h2 className="text-center" style={{ marginBottom: 'var(--space-xl)' }}>
          Why <span className="gradient-text">SnipLink</span>?
        </h2>
        <div className="features-grid">
          {features.map((feature, i) => (
            <div className={`card feature-card animate-slide-up stagger-${(i % 3) + 1}`} key={i}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="section container text-center">
          <div className="card card-glass card-glow cta-card">
            <h2 style={{ marginBottom: 'var(--space-md)' }}>Ready to start?</h2>
            <p className="text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
              Create a free account to unlock analytics, link management, and more.
            </p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create Free Account <FiArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default Home;
