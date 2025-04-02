import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import './ManageCategoriesModal.css';
import { Category, getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService.offline';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesChange
}) => {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Load categories from IndexedDB when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategoryList(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') {
      setError('Category name cannot be empty');
      return;
    }

    if (categoryList.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newCategory = await createCategory(newCategoryName.trim());
      setCategoryList([...categoryList, newCategory]);
      onCategoriesChange([...categories, newCategory.name]);
      setNewCategoryName('');
      
      // Show success toast if window.toast is available
      if (window.toast) {
        window.toast.success('Category added successfully');
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      setError('Failed to add category. Please try again.');
      
      // Show error toast if window.toast is available
      if (window.toast) {
        window.toast.error('Failed to add category');
      }
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditedName(category.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditedName('');
    setError(null);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    if (editedName.trim() === '') {
      setError('Category name cannot be empty');
      return;
    }

    if (categoryList.some(cat => 
      cat.id !== editingCategory.id && 
      cat.name.toLowerCase() === editedName.trim().toLowerCase()
    )) {
      setError('Category name already exists');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedCategory = await updateCategory(editingCategory.id, editedName.trim());
      
      // Update category list
      setCategoryList(categoryList.map(cat => 
        cat.id === updatedCategory.id ? updatedCategory : cat
      ));
      
      // Update categories in parent component
      const updatedCategories = categories.map(cat => 
        cat === editingCategory.name ? updatedCategory.name : cat
      );
      onCategoriesChange(updatedCategories);
      
      // Reset state
      setEditingCategory(null);
      setEditedName('');
      
      // Show success toast if window.toast is available
      if (window.toast) {
        window.toast.success('Category updated successfully');
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      setError('Failed to update category. Please try again.');
      
      // Show error toast if window.toast is available
      if (window.toast) {
        window.toast.error('Failed to update category');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      await deleteCategory(categoryToDelete.id);
      
      // Update category list
      setCategoryList(categoryList.filter(cat => cat.id !== categoryToDelete.id));
      
      // Update categories in parent component
      const updatedCategories = categories.filter(cat => cat !== categoryToDelete.name);
      onCategoriesChange(updatedCategories);
      
      // Show success toast if window.toast is available
      if (window.toast) {
        window.toast.success('Category deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category. Please try again.');
      
      // Show error toast if window.toast is available
      if (window.toast) {
        window.toast.error('Failed to delete category');
      }
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteCategory}
        itemName={categoryToDelete?.name || ''}
        itemType="category"
      />
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Categories"
        size="medium"
      >
      <div className="categories-modal-content">
        {error && (
          <div className="error-message-box">
            <p>{error}</p>
          </div>
        )}
        
        <div className="add-category-form">
          <h4>Add New Category</h4>
          <div className="form-row">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              disabled={loading}
            />
            <button 
              className="add-btn" 
              onClick={handleAddCategory}
              disabled={loading || newCategoryName.trim() === ''}
            >
              Add Category
            </button>
          </div>
        </div>
        
        <div className="categories-list">
          <h4>Existing Categories</h4>
          {loading && <p className="loading-text">Loading...</p>}
          {!loading && categoryList.length === 0 && (
            <p className="empty-text">No categories found. Add your first category above.</p>
          )}
          <ul>
            {categoryList.map(category => (
              <li key={category.id}>
                {editingCategory?.id === category.id ? (
                  <div className="edit-category-form">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter category name"
                      disabled={loading}
                    />
                    <div className="edit-actions">
                      <button 
                        className="save-btn" 
                        onClick={handleUpdateCategory}
                        disabled={loading || editedName.trim() === ''}
                      >
                        Save
                      </button>
                      <button 
                        className="cancel-btn" 
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="category-item">
                    <span className="category-name">{category.name}</span>
                    <div className="category-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => startEditCategory(category)}
                        disabled={loading}
                      >
                        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" style={{color: '#3b82f6'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="#3b82f6" />
                        </svg>
                      </button>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteCategory(category)}
                        disabled={loading}
                      >
                        <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="#ffff" viewBox="0 0 24 24" style={{color: '#ffff'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#ef4444" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="modal-buttons">
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
      </Modal>
    </>
  );
};

export default ManageCategoriesModal;