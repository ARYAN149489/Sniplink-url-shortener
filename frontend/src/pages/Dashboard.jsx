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
  FiPlus, FiLink, FiEye, FiTrendingUp, FiStar,
  FiCopy, FiBarChart2, FiTrash2, FiSearch, FiX,
} from 'react-icons/fi';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const debounceRef = useRef(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.get('/analytics/overview');
      setOverview(data);
    } catch (error) {
      toast.error('Failed to load analytics: ' + error.message);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadLinks = useCallback(async (searchTerm = '') => {
    setLoadingLinks(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const data = await api.get(`/url/my-links${params}`);
      setLinks(data.urls);
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

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) return;
    try {
      await api.del(`/url/${id}`);
      toast.success('Link deleted.');
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

  // Chart data
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
            borderColor: '#8b5cf6',
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
              gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');
              return gradient;
            },
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#8b5cf6',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            fill: true,
            tension: 0.4,
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
        backgroundColor: 'rgba(15, 15, 30, 0.95)',
        titleColor: '#e8e8f0',
        bodyColor: '#9a9ab5',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (item) => `${item.raw} click${item.raw !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
        ticks: { color: '#6a6a85', font: { size: 11, family: 'Inter' }, maxRotation: 0, maxTicksLimit: 8 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
        ticks: { color: '#6a6a85', font: { size: 11, family: 'Inter' }, stepSize: 1 },
      },
    },
  };

  const avgClicks = overview && overview.totalLinks > 0
    ? Math.round(overview.totalClicks / overview.totalLinks)
    : 0;

  return (
    <main className="page-content">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header animate-slide-up">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted" style={{ marginTop: '4px' }}>Your link analytics at a glance</p>
          </div>
          <Link to="/" className="btn btn-primary">
            <FiPlus size={16} /> New Link
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid animate-slide-up stagger-1">
          <StatCard
            icon={<FiLink size={22} />}
            iconBg="rgba(139, 92, 246, 0.1)"
            iconColor="var(--accent-start)"
            value={overview?.totalLinks ?? '—'}
            label="Total Links"
          />
          <StatCard
            icon={<FiEye size={22} />}
            iconBg="rgba(52, 211, 153, 0.1)"
            iconColor="var(--color-success)"
            value={overview?.totalClicks ?? '—'}
            label="Total Clicks"
          />
          <StatCard
            icon={<FiTrendingUp size={22} />}
            iconBg="rgba(96, 165, 250, 0.1)"
            iconColor="var(--color-info)"
            value={avgClicks}
            label="Avg. Clicks/Link"
          />
          <StatCard
            icon={<FiStar size={22} />}
            iconBg="rgba(251, 191, 36, 0.1)"
            iconColor="var(--color-warning)"
            value={overview?.topLink?.clicks ?? '—'}
            label="Top Link Clicks"
            subtitle={overview?.topLink?.shortUrl}
          />
        </div>

        {/* Clicks Chart */}
        {chartData && (
          <div className="card chart-container animate-slide-up stagger-2">
            <div className="chart-header">
              <h3>Clicks Over Time</h3>
              <span className="badge badge-info">Last 30 days</span>
            </div>
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Links Table */}
        <div className="card links-section animate-slide-up stagger-3">
          <div className="links-header">
            <h3>Your Links</h3>
            <div className="search-input-wrapper">
              <FiSearch size={14} className="search-icon-el" />
              <input
                type="text"
                className="form-input"
                placeholder="Search links..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search links"
              />
            </div>
          </div>

          {loadingLinks ? (
            <div className="loading-container"><span className="spinner spinner-lg" /></div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h3>No links yet</h3>
              <p>Create your first shortened URL to see it here.</p>
              <Link to="/" className="btn btn-primary">Create Your First Link</Link>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Short Link</th>
                    <th>Original URL</th>
                    <th>Clicks</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" className="table-link">
                          /{link.customAlias || link.shortCode}
                        </a>
                      </td>
                      <td className="table-url" title={link.originalUrl}>{link.originalUrl}</td>
                      <td><span style={{ fontWeight: 600 }}>{link.clicks}</span></td>
                      <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleCopy(link.shortUrl)} title="Copy link">
                            <FiCopy size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => viewAnalytics(link.customAlias || link.shortCode)} title="View analytics">
                            <FiBarChart2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(link.id)} title="Delete" style={{ color: 'var(--color-error)' }}>
                            <FiTrash2 size={14} />
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

        {/* Recent Activity */}
        {overview?.recentClicks && overview.recentClicks.length > 0 && (
          <div className="card animate-slide-up stagger-4" style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-xl)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>Recent Activity</h3>
            {overview.recentClicks.map((click, i) => (
              <div key={i} className="activity-item">
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {click.url ? `/${click.url.shortCode}` : 'Unknown'}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    {click.browser} · {click.os} · {click.device}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {timeAgo(click.timestamp)}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                    {click.referrer === 'Direct' ? 'Direct' : truncate(click.referrer, 30)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {modalData && (
        <div className="modal-overlay visible" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2>Link Analytics</h2>
              <button className="btn btn-ghost btn-icon" onClick={closeModal} aria-label="Close">
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="loading-container"><span className="spinner spinner-lg" /></div>
              ) : modalData.url ? (
                <>
                  <div className="modal-url-info">
                    <div className="result-url" style={{ marginBottom: 'var(--space-md)' }}>
                      <div>
                        <a href={modalData.url.shortUrl} target="_blank" rel="noopener noreferrer" className="short-link">
                          {modalData.url.shortUrl}
                        </a>
                        <div className="original-link">{modalData.url.originalUrl}</div>
                      </div>
                    </div>
                    <div className="modal-stats">
                      <span style={{ fontSize: '2rem', fontWeight: 800 }}>{modalData.url.totalClicks}</span>
                      <span className="text-muted" style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>total clicks</span>
                    </div>
                  </div>

                  <Breakdown title="Top Browsers" items={modalData.analytics?.browsers} />
                  <Breakdown title="Devices" items={modalData.analytics?.devices} />
                  <Breakdown title="Operating Systems" items={modalData.analytics?.operatingSystems} />
                  <Breakdown title="Referrers" items={modalData.analytics?.referrers} />
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

/* ─── Sub-components ───────────────────────────────────────── */

const StatCard = ({ icon, iconBg, iconColor, value, label, subtitle }) => (
  <div className="card stat-card">
    <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
      {icon}
    </div>
    <span className="stat-value">{value}</span>
    {subtitle && (
      <a href={subtitle} target="_blank" rel="noopener noreferrer" className="stat-subtitle">
        {subtitle}
      </a>
    )}
    <span className="stat-label">{label}</span>
  </div>
);

const Breakdown = ({ title, items }) => {
  if (!items || items.length === 0) {
    return (
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4 className="breakdown-title">{title}</h4>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>No data yet</p>
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h4 className="breakdown-title">{title}</h4>
      {items.slice(0, 5).map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={i} className="breakdown-item">
            <div className="breakdown-row">
              <span style={{ fontSize: '0.85rem' }}>{item.name}</span>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>{item.count} ({pct}%)</span>
            </div>
            <div className="breakdown-bar-bg">
              <div className="breakdown-bar" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Utility Functions ────────────────────────────────────── */

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const truncate = (str, len) => {
  if (!str || str.length <= len) return str;
  return str.substring(0, len) + '...';
};

export default Dashboard;
