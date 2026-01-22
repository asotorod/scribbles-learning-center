import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate('/admin');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      if (!['super_admin', 'admin'].includes(user.role)) {
        setError('You do not have administrator access.');
        setLoading(false);
        return;
      }

      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <img src="/logo.png" alt="Scribbles Learning Center" className="admin-login-logo" />
          <h1>Admin Portal</h1>
          <p>Sign in to manage Scribbles Learning Center</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="admin-login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@scribbleslearning.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            size="large"
          >
            Sign In
          </Button>
        </form>

        <div className="admin-login-demo">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: admin@scribbleslearning.com</p>
          <p>Password: admin123</p>
        </div>

        <Link to="/" className="admin-login-back">
          ← Back to Website
        </Link>
      </div>

      <div className="admin-login-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  );
};

export default AdminLogin;
