import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import './Auth.css';

const Signup = () => {
  const { isAuthenticated, signup, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
      setTimeout(() => navigate('/dashboard'), 400);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-brand-header">
          <Logo size={36} />
          <h1>Create SnipLink Account</h1>
          <p className="auth-subtitle">
            Deploy short URLs with sub-millisecond edge redirection and click analytics
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">
              Full Name <span className="text-muted">(Optional)</span>
            </label>
            <input
              type="text"
              id="signup-name"
              className="form-input"
              placeholder="Alex Doe"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Work Email</label>
            <input
              type="email"
              id="signup-email"
              className="form-input"
              placeholder="developer@company.com"
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
              placeholder="Minimum 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="signup-confirm-password"
              className="form-input"
              placeholder="Re-enter password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary submit-auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Free Account'
            )}
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
