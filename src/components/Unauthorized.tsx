import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Login.css'; // Reusing login styles for consistency

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleGoToLogin = async () => {
    // Properly logout using the auth context
    await logout();
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form">
          <h2 className="login-title">Access Denied</h2>
          <p className="login-subtitle">You don't have permission to access this page</p>
          
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={handleGoBack} 
              className="login-button" 
              style={{ marginBottom: '1rem', backgroundColor: '#6c757d' }}
            >
              Go Back
            </button>
            
            <button 
              onClick={handleGoToLogin} 
              className="login-button"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
      <div className="login-image-section">
        {/* Image section will be filled with gradient background */}
      </div>
    </div>
  );
};

export default Unauthorized;