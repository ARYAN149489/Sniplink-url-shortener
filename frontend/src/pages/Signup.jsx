import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const { isAuthenticated, signup, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const success = await signup(name, email, password);
    if (success) {
      setTimeout(() => navigate('/dashboard'), 500);
    }
  };

  return (
    <main className="auth-page">
      <div className="card card-glass card-glow auth-card">
        <h1>Create account</h1>
        <p className="auth-subtitle">Start shortening URLs and tracking analytics for free</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">
              Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              type="text"
              id="signup-name"
              className="form-input"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email address</label>
            <input
              type="email"
              id="signup-email"
              className="form-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              type="password"
              id="signup-password"
              className="form-input"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password" className="form-label">Confirm password</label>
            <input
              type="password"
              id="signup-confirm-password"
              className="form-input"
              placeholder="Re-enter your password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
};

export default Signup;
