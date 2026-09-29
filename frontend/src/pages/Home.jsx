import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import {
  FiLink, FiZap, FiBarChart2, FiGrid, FiShield, FiClock,
  FiCopy, FiCheck, FiArrowRight, FiExternalLink, FiDownload,
  FiCpu, FiActivity, FiGlobe, FiCornerDownLeft
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
      setRecentLinks(data.urls || []);
    } catch (error) {
      console.error('Failed to load recent links:', error);
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a target URL to shorten.');
      return;
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setLoading(true);
    try {
      const body = { originalUrl: formattedUrl };
      if (alias.trim()) body.customAlias = alias.trim();
      if (expires) body.expiresIn = expires;

      const data = await api.post('/url/shorten', body);
      setResult(data.url);
      toast.success('Short link generated successfully');
      setUrl('');
      setAlias('');

      if (isAuthenticated) loadRecentLinks();

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      toast.error(error.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied link to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20, 360, 360);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${result?.customAlias || result?.shortCode || 'link'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded (PNG)');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        toast.success('Pasted from clipboard');
      }
    } catch {
      // Browser permission denied or not supported
    }
  };

  return (
    <main className="page-content">
      {/* Hero Section */}
      <section className="hero container">
        <div className="hero-pill animate-slide-up">
          <span className="pulse-dot" />
          <span>Sub-Millisecond In-Memory Redirect Engine</span>
        </div>

        <h1 className="hero-title animate-slide-up stagger-1">
          Short links engineered for speed and analytics.
        </h1>

        <p className="hero-subtitle animate-slide-up stagger-2">
          High-throughput URL redirection backed by in-memory caching, comprehensive
          click telemetry, and dynamic vector QR codes.
        </p>

        {/* Shortener Studio */}
        <div className="shortener-box animate-slide-up stagger-3">
          <form onSubmit={handleShorten} className="shortener-form">
            <div className="input-group-unified">
              <div className="input-prefix">
                <FiLink size={16} />
              </div>
              <input
                type="text"
                className="url-input"
                placeholder="Paste destination URL (e.g. github.com/user/repo)..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-label="URL to shorten"
                autoComplete="off"
                required
              />
              {!url && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="btn btn-ghost btn-sm paste-btn"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Shorten</span>
                    <FiCornerDownLeft size={14} className="submit-kbd-icon" />
                  </>
                )}
              </button>
            </div>

            <div className="options-toolbar">
              <div className="option-field">
                <span className="option-label">Back-half Slug</span>
                <div className="slug-input-wrapper">
                  <span className="slug-domain">/</span>
                  <input
                    type="text"
                    className="slug-input font-mono"
                    placeholder="custom-slug"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    aria-label="Custom back-half slug"
                  />
                </div>
              </div>

              <div className="option-field">
                <span className="option-label">Expiration Policy</span>
                <select
                  className="option-select"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  aria-label="Expiration timeframe"
                >
                  <option value="">Permanent (No expiration)</option>
                  <option value="1">Expire in 24 hours</option>
                  <option value="7">Expire in 7 days</option>
                  <option value="30">Expire in 30 days</option>
                  <option value="90">Expire in 90 days</option>
                  <option value="365">Expire in 1 year</option>
                </select>
              </div>
            </div>
          </form>

          {/* Generated Result Card */}
          {result && (
            <div className="result-card" ref={resultRef}>
              <div className="result-header">
                <div className="result-status">
                  <span className="badge badge-success">
                    <span className="status-dot" /> Live & Cached
                  </span>
                  <span className="result-timestamp font-mono">
                    Code: {result.customAlias || result.shortCode}
                  </span>
                </div>
                <div className="result-stats-pill font-mono">
                  <span>0 clicks</span>
                </div>
              </div>

              <div className="result-body">
                <div className="result-main-col">
                  <div className="short-url-row">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="short-url-link font-mono"
                    >
                      {result.shortUrl}
                    </a>
                    <div className="short-url-actions">
                      <button
                        className={`btn btn-secondary btn-sm copy-btn ${copied ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(result.shortUrl)}
                      >
                        {copied ? <><FiCheck size={14} /> Copied</> : <><FiCopy size={14} /> Copy</>}
                      </button>
                      <a
                        href={result.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        title="Open destination"
                      >
                        <FiExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="destination-preview">
                    <span className="destination-label">Target:</span>
                    <span className="destination-text" title={result.originalUrl}>
                      {result.originalUrl}
                    </span>
                  </div>
                </div>

                <div className="result-qr-col">
                  <div className="qr-preview-box">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={result.shortUrl}
                      size={96}
                      bgColor="#ffffff"
                      fgColor="#080a0f"
                      level="M"
                    />
                  </div>
                  <button
                    onClick={downloadQR}
                    className="btn btn-ghost btn-sm qr-download-btn"
                    title="Download PNG QR code"
                  >
                    <FiDownload size={13} />
                    <span>Download QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Engineering Highlights Strip */}
        <div className="stats-strip">
          <div className="strip-item">
            <span className="strip-val font-mono">&lt; 2ms</span>
            <span className="strip-label">Redirect Latency</span>
          </div>
          <div className="strip-divider" />
          <div className="strip-item">
            <span className="strip-val font-mono">Redis</span>
            <span className="strip-label">In-Memory Cache Tier</span>
          </div>
          <div className="strip-divider" />
          <div className="strip-item">
            <span className="strip-val font-mono">100%</span>
            <span className="strip-label">Click Telemetry</span>
          </div>
          <div className="strip-divider" />
          <div className="strip-item">
            <span className="strip-val font-mono">Zero</span>
            <span className="strip-label">Tracking Cookies</span>
          </div>
        </div>
      </section>

      {/* Authenticated Recent Links */}
      {isAuthenticated && recentLinks.length > 0 && (
        <section className="container recent-links-wrapper">
          <div className="section-header-row">
            <div>
              <h3>Recent Dispatches</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Your latest shortened links and live click counts
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-sm">
              <span>View All in Dashboard</span>
              <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Destination</th>
                  <th>Total Clicks</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLinks.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <span className="font-mono link-code-badge">
                        /{link.customAlias || link.shortCode}
                      </span>
                    </td>
                    <td className="table-url-cell" title={link.originalUrl}>
                      {link.originalUrl}
                    </td>
                    <td>
                      <span className="font-mono click-count">{link.clicks}</span>
                    </td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.8125rem' }}>
                      {new Date(link.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => copyToClipboard(link.shortUrl)}
                        title="Copy short link"
                      >
                        <FiCopy size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bento Grid Features */}
      <section className="container features-section">
        <div className="features-intro">
          <span className="section-eyebrow">Architecture & Reliability</span>
          <h2>Engineered for developer workflows.</h2>
          <p className="features-sub">
            Built from the ground up for high concurrency, zero-overhead redirects, and actionable telemetry.
          </p>
        </div>

        <div className="bento-grid">
          {/* Bento Card 1 */}
          <div className="bento-card bento-wide">
            <div className="bento-header">
              <div className="bento-icon-wrapper">
                <FiZap size={18} />
              </div>
              <span className="bento-tag font-mono">Performance</span>
            </div>
            <h3>Sub-Millisecond In-Memory Routing</h3>
            <p>
              Short codes are cached in high-performance Redis memory tiers. Redirections are delivered
              instantly via HTTP 302 with sub-millisecond retrieval times.
            </p>
            <div className="bento-code-preview font-mono">
              <div className="preview-line">
                <span className="token-comment">// Cold DB Query: ~14ms</span>
              </div>
              <div className="preview-line">
                <span className="token-keyword">GET</span> /api-docs <span className="token-success">→ 302 Found [1.2ms RAM Cache Hit]</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-icon-wrapper">
                <FiBarChart2 size={18} />
              </div>
              <span className="bento-tag font-mono">Telemetry</span>
            </div>
            <h3>Deep Visitor Analytics</h3>
            <p>
              Non-blocking asynchronous tracking inspects referrers, browsers, device form-factors,
              and operating systems without degrading user redirect speed.
            </p>
          </div>

          {/* Bento Card 3 */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-icon-wrapper">
                <FiGrid size={18} />
              </div>
              <span className="bento-tag font-mono">Physical Media</span>
            </div>
            <h3>Vector QR Code Generation</h3>
            <p>
              Automated high-contrast matrix barcodes created for every link. Instant download
              ready for billboards, print collateral, packaging, and slides.
            </p>
          </div>

          {/* Bento Card 4 */}
          <div className="bento-card bento-wide">
            <div className="bento-header">
              <div className="bento-icon-wrapper">
                <FiShield size={18} />
              </div>
              <span className="bento-tag font-mono">Governance</span>
            </div>
            <h3>Custom Slugs & Time-To-Live Policies</h3>
            <p>
              Maintain branding consistency with custom URL identifiers. Configure automatic TTL expiration
              policies to automatically decommission temporary campaigns.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      {!isAuthenticated && (
        <section className="container cta-section">
          <div className="cta-box">
            <div className="cta-content">
              <h2>Gain complete visibility into your link traffic.</h2>
              <p className="text-secondary">
                Create a free account to track clicks, configure custom back-halves, and access deep telemetry charts.
              </p>
            </div>
            <div className="cta-action">
              <Link to="/signup" className="btn btn-primary btn-lg">
                <span>Deploy Short Links</span>
                <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default Home;
