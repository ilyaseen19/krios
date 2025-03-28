import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './PasswordModal.css';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Import the auth service to verify the password
      const { authenticateUser } = await import('../../services/authService');
      
      // Get the current username from localStorage - this is set during login in AuthContext
      const currentUsername = localStorage.getItem('username');
      
      // Ensure we have a username before proceeding
      if (!currentUsername) {
        setError('User session not found. Please log in again.');
        setIsVerifying(false);
        return;
      }
      
      try {
        // Try to authenticate with the current username and entered password
        await authenticateUser(currentUsername, password);
        
        // If we get here, authentication was successful
        if (userRole === 'cashier') {
          // If user is a cashier, just close the modal without navigation
          onClose();
        } else {
          // For non-cashier roles (admin, manager, etc.), call onSuccess which will handle navigation
          onSuccess();
        }
      } catch (error) {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Authentication failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Authentication"
      size="small"
      actions={
        <div className="modal-buttons">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Submit'}
          </button>
        </div>
      }
    >
      <div className="password-modal-content">
        <p className="modal-description">
          Please enter your password to access the admin dashboard.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              disabled={isVerifying}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </Modal>
  );
};

export default PasswordModal;