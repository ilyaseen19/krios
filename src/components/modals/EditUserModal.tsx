import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { User } from '../../types/user';
import { userRoles, userStatuses } from '../../constants/userConstants';
import { updateUser } from '../../services/userService';
import './Modal.css';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when user prop changes
  useEffect(() => {
    if (user) {
      setEditingUser({ ...user });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingUser) return;
    
    const { name, value } = e.target;
    setEditingUser(prev => ({
      ...prev!,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!editingUser) return;

    // Basic validation
    if (!editingUser.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!editingUser.email.trim()) {
      setError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (editingUser.password && editingUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Update user in IndexedDB
      const updatedUser = await updateUser(editingUser.id, editingUser);
      
      // Notify parent component
      onUserUpdated(updatedUser);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no user is provided, don't render the modal content
  if (!editingUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
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
          value={editingUser.name}
          onChange={handleInputChange}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={editingUser.email}
          onChange={handleInputChange}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={editingUser.password || ''}
          onChange={handleInputChange}
          placeholder="Enter new password"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={editingUser.role}
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
          value={editingUser.status}
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

export default EditUserModal;