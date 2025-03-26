import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import logo from '../assets/logo.svg';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
      const storedRole = localStorage.getItem('userRole');
      if (storedRole && storedRole.toLowerCase() === 'admin') {
        navigate('/products');
      } else if (storedRole && storedRole.toLowerCase() === 'cashier') {
        navigate('/pos');
      } else if (storedRole) {
        navigate('/dashboard');
      } else {
        setError('Invalid user role');
      }
    } catch (err: any) {
      if (err.message === 'Account inactive') {
        setError('Your account is inactive. Please contact an administrator.');
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <form onSubmit={handleSubmit} className="login-form">
        <div className="login-logo">
          <img src={logo} alt="Krios Logo" />
        </div>
        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">Please login to your account</p>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Name</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="small" color="#ffffff" /> : 'Sign in'}
        </button>

        <div className="forgot-password">
          <a href="#">Forgot Password?</a>
        </div>
        </form>
      </div>
      <div className="login-image-section">
        {/* Image section will be filled with gradient background */}
      </div>
    </div>
  );
};

export default Login;