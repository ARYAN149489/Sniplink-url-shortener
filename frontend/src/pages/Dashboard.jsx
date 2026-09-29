import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import * as api from '../api/api';
import {
  FiPlus, FiLink, FiEye, FiTrendingUp, FiActivity,
  FiCopy, FiBarChart2, FiTrash2, FiSearch, FiX, FiCheck,
  FiGlobe, FiSmartphone, FiMonitor, FiExternalLink, FiClock
} from 'react-icons/fi';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const debounceRef = useRef(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.get('/analytics/overview');
      setOverview(data);
    } catch (error) {
      toast.error('Failed to load telemetry: ' + error.message);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadLinks = useCallback(async (searchTerm = '') => {
    setLoadingLinks(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const data = await api.get(`/url/my-links${params}`);
      setLinks(data.urls || []);
    } catch (error) {
      toast.error('Failed to load links: ' + error.message);
    } finally {
      setLoadingLinks(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadLinks();
  }, [loadOverview, loadLinks]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadLinks(value), 300);
  };

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently decommission this short link?')) return;
    try {
      await api.del(`/url/${id}`);
      toast.success('Short link decommissioned');
      setLinks((prev) => prev.filter((l) => l.id !== id));
      loadOverview();
    } catch (error) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const viewAnalytics = async (code) => {
    setModalLoading(true);
    setModalData({});
    try {
      const data = await api.get(`/analytics/${code}`);
      setModalData(data);
    } catch (error) {
      toast.error(error.message);
      setModalData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setModalData(null);

  // Modern Chart.js Config
  const chartData = overview?.clicksOverTime
    ? {
        labels: overview.clicksOverTime.map((d) => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Clicks',
            data: overview.clicksOverTime.map((d) => d.clicks),
            borderColor: '#3b82f6',
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
              gradient.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
              gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)');
              return gradient;
            },
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f131c',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#28334b',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        titleFont: { family: 'Inter', size: 12, weight: '600' },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        callbacks: {
          label: (item) => `${item.raw} click${item.raw !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, family: 'Inter' }, maxRotation: 0, maxTicksLimit: 8 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, family: 'JetBrains Mono' }, stepSize: 1 },
      },
    },
  };

  const avgClicks = overview && overview.totalLinks > 0
    ? Math.round((overview.totalClicks / overview.totalLinks) * 10) / 10
    : 0;

  return (
    <main className="page-content">
      <div className="container dashboard-container">
        {/* Header */}
        <div className="dashboard-header animate-slide-up">
          <div>
            <div className="dashboard-badge-row">
              <span className="badge badge-info">Link Telemetry Hub</span>
            </div>
            <h1>Analytics & Links</h1>
            <p className="dashboard-subtitle">
              Monitor traffic distribution, referrer telemetry, and link lifecycles in real time.
            </p>
          </div>
          <Link to="/" className="btn btn-primary">
            <FiPlus size={16} />
            <span>Create New Link</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid animate-slide-up stagger-1">
          <StatCard
            icon={<FiLink size={18} />}
            value={overview?.totalLinks ?? '—'}
            label="Active Links"
          />
          <StatCard
            icon={<FiEye size={18} />}
            value={overview?.totalClicks ?? '—'}
            label="Total Redirects"
          />
          <StatCard
            icon={<FiTrendingUp size={18} />}
            value={avgClicks}
            label="Average Clicks / Link"
          />
          <StatCard
            icon={<FiActivity size={18} />}
            value={overview?.topLink?.clicks ?? '—'}
            label="Top Link Volume"
            subtitle={overview?.topLink?.shortUrl}
          />
        </div>

        {/* Clicks Trend Chart */}
        {chartData && (
          <div className="card chart-card animate-slide-up stagger-2">
            <div className="chart-header">
              <div>
                <h3>Traffic Volume</h3>
                <span className="chart-sub">Aggregated click trends over the past 30 days</span>
              </div>
              <span className="badge badge-info font-mono">30-day window</span>
            </div>
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Links Table Section */}
        <div className="card links-section animate-slide-up stagger-3">
          <div className="links-header">
            <div>
              <h3>Provisioned URLs</h3>
              <span className="links-count font-mono">{links.length} total entries</span>
            </div>
            <div className="search-input-wrapper">
              <FiSearch size={14} className="search-icon-el" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search short code or URL..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search links"
              />
              {search && (
                <button
                  className="search-clear-btn"
                  onClick={() => handleSearch('')}
                  aria-label="Clear search"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {loadingLinks ? (
            <div className="loading-state">
              <span className="spinner spinner-lg" />
              <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                Fetching link inventory...
              </p>
            </div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <FiLink size={24} />
              </div>
              <h3>No short links found</h3>
              <p className="text-muted">
                {search ? 'No links match your current search query.' : 'Generate your first shortened link to initiate click telemetry.'}
              </p>
              {!search && (
                <Link to="/" className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
                  Create Short Link
                </Link>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Short Code</th>
                    <th>Destination URL</th>
                    <th>Clicks</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-slug-badge font-mono"
                          title="Open link in new tab"
                        >
                          /{link.customAlias || link.shortCode}
                          <FiExternalLink size={10} className="external-hint" />
                        </a>
                      </td>
                      <td className="table-destination-cell" title={link.originalUrl}>
                        {link.originalUrl}
                      </td>
                      <td>
                        <span className="font-mono clicks-num">{link.clicks}</span>
                      </td>
                      <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                        {new Date(link.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-ghost btn-sm action-btn"
                            onClick={() => handleCopy(link.shortUrl, link.id)}
                            title="Copy short link"
                          >
                            {copiedId === link.id ? <FiCheck size={13} color="#10b981" /> : <FiCopy size={13} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm action-btn"
                            onClick={() => viewAnalytics(link.customAlias || link.shortCode)}
                            title="View click telemetry"
                          >
                            <FiBarChart2 size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm action-btn btn-delete"
                            onClick={() => handleDelete(link.id)}
                            title="Decommission link"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Traffic Telemetry Stream */}
        {overview?.recentClicks && overview.recentClicks.length > 0 && (
          <div className="card activity-card animate-slide-up stagger-4">
            <div className="activity-header">
              <div className="activity-title-group">
                <FiClock size={16} className="text-secondary" />
                <h3>Live Dispatch Log</h3>
              </div>
              <span className="badge badge-success font-mono">
                <span className="status-dot" /> Real-Time Telemetry
              </span>
            </div>

            <div className="activity-list">
              {overview.recentClicks.map((click, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-left">
                    <div className="activity-slug font-mono">
                      {click.url ? `/${click.url.shortCode}` : '/dispatch'}
                    </div>
                    <div className="activity-details">
                      <span>{click.browser || 'Browser'}</span>
                      <span className="sep">·</span>
                      <span>{click.os || 'OS'}</span>
                      <span className="sep">·</span>
                      <span>{click.device || 'Desktop'}</span>
                    </div>
                  </div>

                  <div className="activity-right">
                    <span className="activity-time font-mono">
                      {timeAgo(click.timestamp)}
                    </span>
                    <span className="activity-referrer" title={click.referrer}>
                      {click.referrer === 'Direct' ? 'Direct traffic' : click.referrer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {modalData && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <span className="badge badge-info font-mono" style={{ marginBottom: '0.4rem' }}>
                  Telemetry Inspection
                </span>
                <h2>Link Analytics</h2>
              </div>
              <button className="btn btn-ghost btn-icon modal-close-btn" onClick={closeModal} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>

            <div className="modal-content">
              {modalLoading ? (
                <div className="modal-loading">
                  <span className="spinner spinner-lg" />
                  <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                    Compiling telemetry aggregates...
                  </p>
                </div>
              ) : modalData.url ? (
                <>
                  <div className="modal-summary-panel">
                    <div className="modal-link-details">
                      <a
                        href={modalData.url.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="modal-short-link font-mono"
                      >
                        {modalData.url.shortUrl}
                        <FiExternalLink size={12} />
                      </a>
                      <span className="modal-original-url" title={modalData.url.originalUrl}>
                        {modalData.url.originalUrl}
                      </span>
                    </div>
                    <div className="modal-click-metric font-mono">
                      <span className="metric-num">{modalData.url.totalClicks}</span>
                      <span className="metric-label">total clicks</span>
                    </div>
                  </div>

                  <div className="breakdown-grid">
                    <BreakdownCard
                      title="Web Browsers"
                      icon={<FiGlobe size={15} />}
                      items={modalData.analytics?.browsers}
                    />
                    <BreakdownCard
                      title="Operating Systems"
                      icon={<FiMonitor size={15} />}
                      items={modalData.analytics?.operatingSystems}
                    />
                    <BreakdownCard
                      title="Device Classes"
                      icon={<FiSmartphone size={15} />}
                      items={modalData.analytics?.devices}
                    />
                    <BreakdownCard
                      title="Traffic Referrers"
                      icon={<FiActivity size={15} />}
                      items={modalData.analytics?.referrers}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

/* ─── Sub-Components ────────────────────────────────────────── */

const StatCard = ({ icon, value, label, subtitle }) => (
  <div className="card stat-card">
    <div className="stat-top">
      <span className="stat-label">{label}</span>
      <div className="stat-icon-wrap">{icon}</div>
    </div>
    <div className="stat-value font-mono">{value}</div>
    {subtitle && (
      <a href={subtitle} target="_blank" rel="noopener noreferrer" className="stat-subtitle font-mono">
        {subtitle}
      </a>
    )}
  </div>
);

const BreakdownCard = ({ title, icon, items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="breakdown-card">
        <div className="breakdown-header">
          {icon}
          <h4>{title}</h4>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', padding: '0.5rem 0' }}>
          No data recorded yet
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="breakdown-card">
      <div className="breakdown-header">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="breakdown-list">
        {items.slice(0, 5).map((item, i) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={i} className="breakdown-row">
              <div className="breakdown-row-info">
                <span className="breakdown-name">{item.name || 'Unknown'}</span>
                <span className="breakdown-num font-mono">{item.count} ({pct}%)</span>
              </div>
              <div className="breakdown-track">
                <div className="breakdown-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Utilities ────────────────────────────────────────────── */

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

export default Dashboard;
