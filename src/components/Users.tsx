import React, { useState, useMemo, useEffect } from 'react';
import './Users.css';
import { User } from '../types/user';
import { userRoles, userStatuses } from '../constants/userConstants';
import { Modal, AddUserModal, EditUserModal } from './modals';
import Table, { TableColumn } from './Table';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Load users from IndexedDB on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const loadedUsers = await getUsers();
        
        // Set users from IndexedDB
        setUsers(loadedUsers);
        
        setError(null);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; // Number of users to display per page

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === '' || user.role === roleFilter;
      const matchesStatus = statusFilter === '' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Get current users for the page
  const currentUsers = useMemo(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  }, [filteredUsers, currentPage, usersPerPage]);
  
  // Handle page navigation
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle user added from AddUserModal
  const handleUserAdded = (newUser: User) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  // Handle user updated from EditUserModal
  const handleUserUpdated = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  };

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Handle opening delete confirmation modal
  const openDeleteModal = (id: number) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (userToDelete !== null) {
      try {
        await deleteUser(userToDelete);
        setUsers(users.filter(user => user.id !== userToDelete));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: User) => {
    setCurrentUser(user);
    setShowEditModal(true);
  };

  return (
    <div className="users-container">
      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={currentUser}
        onUserUpdated={handleUserUpdated}
      />

      <div className="users-header">
        <h2 className="section-title">User Management</h2>
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New User
        </button>
      </div>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="filter-section">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <select 
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="inventory">Inventory</option>
          </select>
          
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Delete"
          size="small"
          actions={
            <>
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleDeleteUser} className="delete-btn">Delete</button>
            </>
          }
        >
          <div className="confirm-delete-content">
            <svg className="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
          </div>
        </Modal>
      )}

      <Table
        columns={[
          {
            header: 'ID',
            accessor: (user) => `#${user.id}`
          },
          {
            header: 'Name',
            accessor: 'name'
          },
          {
            header: 'Email',
            accessor: 'email'
          },
          {
            header: 'Role',
            accessor: (user) => (
              <span className={`role-badge ${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            )
          },
          {
            header: 'Status',
            accessor: (user) => (
              <span className={`status-badge ${user.status.toLowerCase()}`}>
                {user.status}
              </span>
            )
          },
          {
            header: 'Actions',
            accessor: (user) => (
              <div className="actions-cell">
                <button className="action-btn edit" onClick={() => openEditModal(user)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="action-btn delete" onClick={() => openDeleteModal(user.id)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          }
        ]}
        data={currentUsers}
      />

      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {Array.from({ length: totalPages }, (_, index) => (
          <button 
            key={index + 1}
            className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => goToPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        
        <button 
          className="pagination-btn" 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Users;