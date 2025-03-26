import React, { useState } from 'react';
import Modal from './Modal';
import { User } from '../../types/user';
import { defaultNewUser, userRoles, userStatuses } from '../../constants/userConstants';
import { createUser } from '../../services/userService';
import './Modal.css';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (user: User) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [newUser, setNewUser] = useState({ ...defaultNewUser });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!newUser.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!newUser.email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (!newUser.password) {
      setError('Password is required');
      return;
    }
    
    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create user in IndexedDB
      const createdUser = await createUser(newUser);
      
      // Notify parent component
      onUserAdded(createdUser);
      
      // Reset form and close modal
      setNewUser({ ...defaultNewUser });
      onClose();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      size="medium"
      actions={
        <>
          <button 
            onClick={onClose} 
            className="cancel-btn" 
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add User'}
          </button>
        </>
      }
    >
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={newUser.name}
          onChange={handleInputChange}
          placeholder="Enter name"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={newUser.email}
          onChange={handleInputChange}
          placeholder="Enter email"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={newUser.password}
          onChange={handleInputChange}
          placeholder="Enter password"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={newUser.role}
          onChange={handleInputChange}
          disabled={isSubmitting}
        >
          {userRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={newUser.status}
          onChange={handleInputChange}
          disabled={isSubmitting}
        >
          {userStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
    </Modal>
  );
};

export default AddUserModal;