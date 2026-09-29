import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './Auth.css';

const Login = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      setTimeout(() => navigate('/dashboard'), 400);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-brand-header">
          <Logo size={36} />
          <h1>Sign in to SnipLink</h1>
          <p className="auth-subtitle">
            Enter your credentials to access your link analytics dashboard
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email address</label>
            <input
              type="email"
              id="login-email"
              className="form-input"
              placeholder="developer@company.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              type="password"
              id="login-password"
              className="form-input"
              placeholder="••••••••••••"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary submit-auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account yet? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </main>
  );
};

export default Login;
