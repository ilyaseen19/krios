import React, { useState } from 'react';
import './Users.css';
import { mockUsers, defaultNewUser, User } from '../data/mockUsers';
import Modal from './Modal';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState(defaultNewUser);

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle adding a new user
  const handleAddUser = () => {
    const id = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    const userToAdd = { id, ...newUser };
    setUsers([...users, userToAdd]);
    setNewUser({ name: '', email: '', role: 'Cashier', status: 'Active' });
    setShowAddModal(false);
  };

  // Handle editing a user
  const handleEditUser = () => {
    if (!currentUser) return;
    
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? currentUser : user
    );
    
    setUsers(updatedUsers);
    setShowEditModal(false);
    setCurrentUser(null);
  };

  // Handle deleting a user
  const handleDeleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  // Open edit modal with user data
  const openEditModal = (user) => {
    setCurrentUser({...user});
    setShowEditModal(true);
  };

  return (
    <div className="users-container">
      {/* Add User Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New User"
          size="medium"
          actions={
            <>
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddUser} className="save-btn">Add User</button>
            </>
          }
        >
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={newUser.name} 
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              placeholder="Enter name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={newUser.email} 
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="Enter email"
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select 
              value={newUser.role} 
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Inventory">Inventory</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select 
              value={newUser.status} 
              onChange={(e) => setNewUser({...newUser, status: e.target.value})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && currentUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
          size="medium"
          actions={
            <>
              <button onClick={() => setShowEditModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleEditUser} className="save-btn">Save Changes</button>
            </>
          }
        >
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={currentUser.name} 
              onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={currentUser.email} 
              onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select 
              value={currentUser.role} 
              onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Cashier">Cashier</option>
              <option value="Inventory">Inventory</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select 
              value={currentUser.status} 
              onChange={(e) => setCurrentUser({...currentUser, status: e.target.value})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </Modal>
      )}

      <div className="users-header">
        <h2 className="section-title">User Management</h2>
        <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New User
        </button>
      </div>

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
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
            <option value="Inventory">Inventory</option>
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

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn view">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="action-btn edit" onClick={() => openEditModal(user)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteUser(user.id)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-table-message">
                  No users found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="pagination-btn">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="pagination-btn active">1</button>
        <button className="pagination-btn">2</button>
        <button className="pagination-btn">3</button>
        <button className="pagination-btn">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Users;