import React, { useState } from 'react';
import { mockProducts, productCategories, sortOptions, Product } from '../data/mockProducts';
import './Products.css';
import Modal from './Modal';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(productCategories);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({ 
    name: '', 
    category: categories[0] || '', 
    price: 0, 
    stock: 0, 
    minimumStock: 0, 
    tax: 0, 
    cost: 0, 
    barcode: '', 
    description: '', 
    image: '' 
  });
  const productsPerPage = 8;
  
  // Filter and sort products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock-asc') return a.stock - b.stock;
    if (sortBy === 'stock-desc') return b.stock - a.stock;
    return 0;
  });
  
  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock > 50) return { class: 'stock-high', text: 'In Stock' };
    if (stock > 10) return { class: 'stock-medium', text: 'Low Stock' };
    return { class: 'stock-low', text: 'Out of Stock' };
  };
  
  // Handle view product details
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };
  
  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct({...product});
    setShowEditModal(true);
  };
  
  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };
  
  // Confirm delete product
  const confirmDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setShowDeleteConfirm(false);
    }
  };
  
  // Save edited product
  const saveEditedProduct = () => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
      setShowEditModal(false);
      setEditingProduct(null);
    }
  };

  // Add new category
  const handleAddCategory = () => {
    if (newCategory.trim() !== '' && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  // Edit category
  const handleEditCategory = (oldCategory: string) => {
    setEditingCategory(oldCategory);
    setNewCategory(oldCategory);
  };

  // Save edited category
  const saveEditedCategory = () => {
    if (editingCategory && newCategory.trim() !== '') {
      // Update category in categories list
      const updatedCategories = categories.map(cat => 
        cat === editingCategory ? newCategory.trim() : cat
      );
      setCategories(updatedCategories);

      // Update category in products
      const updatedProducts = products.map(product => {
        if (product.category === editingCategory) {
          return { ...product, category: newCategory.trim() };
        }
        return product;
      });
      setProducts(updatedProducts);

      // Reset state
      setEditingCategory(null);
      setNewCategory('');
    }
  };

  // Delete category
  const handleDeleteCategory = (categoryToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will remove the category from all products.`)) {
      // Remove category from list
      const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
      setCategories(updatedCategories);

      // Update products with this category to use the first available category or empty string
      const defaultCategory = updatedCategories.length > 0 ? updatedCategories[0] : '';
      const updatedProducts = products.map(product => {
        if (product.category === categoryToDelete) {
          return { ...product, category: defaultCategory };
        }
        return product;
      });
      setProducts(updatedProducts);
    }
  };

  // Add new product
  const handleAddProduct = () => {
    // Validate required fields
    if (newProduct.name.trim() === '') {
      alert('Product name is required');
      return;
    }
    if (!newProduct.category) {
      alert('Category is required');
      return;
    }
    if (newProduct.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    if (newProduct.stock < 0) {
      alert('Stock cannot be negative');
      return;
    }
    if (newProduct.minimumStock < 0) {
      alert('Minimum stock cannot be negative');
      return;
    }

    const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const productToAdd = { id, ...newProduct };
    setProducts([...products, productToAdd]);
    setNewProduct({ 
      name: '', 
      category: categories[0] || '', 
      price: 0, 
      stock: 0, 
      minimumStock: 0, 
      tax: 0, 
      cost: 0, 
      barcode: '', 
      description: '', 
      image: '' 
    });
    setShowAddProductModal(false);
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h2 className="section-title">Products</h2>
        <div className="header-actions">
          <button 
            className="category-manage-btn" 
            onClick={() => setShowCategoryModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Manage Categories
          </button>
          <div className={`add-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <button className="add-dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add
            </button>
            <div className="add-dropdown-menu">
              <div className="add-dropdown-item" onClick={() => {
                setShowAddProductModal(true);
                setIsDropdownOpen(false);
              }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Add Product
              </div>
              <div className="add-dropdown-item" onClick={() => {
                setShowCategoryModal(true);
                setIsDropdownOpen(false);
              }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Add Category
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary Card */}
      <div className="inventory-summary-card">
        <h3 className="summary-title">Inventory Summary</h3>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-icon">
              <svg className="w-6 h-6" fill="none" stroke="#7367f0" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Products</span>
              <span className="stat-value">{products.length}</span>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-icon">
              <svg className="w-6 h-6" fill="none" stroke="#28c76f" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Categories</span>
              <span className="stat-value">{productCategories.length}</span>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-icon">
              <svg className="w-6 h-6" fill="none" stroke="#ff9f43" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Inventory Cost</span>
              <span className="stat-value">${products.reduce((sum, product) => sum + (product.price * product.stock), 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="summary-stat">
            <div className="stat-icon">
              <svg className="w-6 h-6" fill="none" stroke="#ea5455" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Expected Revenue</span>
              <span className="stat-value">${products.reduce((sum, product) => sum + (product.price * product.stock * 1.5), 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="category-breakdown">
          <h4 className="breakdown-title">Products by Category</h4>
          <div className="category-stats">
            {productCategories.map(category => {
              const count = products.filter(product => product.category === category).length;
              return (
                <div key={category} className="category-stat">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search products..." 
            className="search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <select 
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {productCategories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
          
          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort By</option>
            {sortOptions.map((option, index) => (
              <option key={index} value={option.value}>{option.label}</option>
            ))}
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="products-grid">
          {currentProducts.map(product => {
            const stockStatus = getStockStatus(product.stock);
            return (
              <div key={product.id} className="product-card">
                <div className="product-img">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={() => handleViewProduct(product)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="quick-action-btn" onClick={() => handleEditProduct(product)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <div className="product-info">
                  <span className={`product-stock ${stockStatus.class}`}>{stockStatus.text}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">${product.price.toFixed(2)}</p>
                  <div className="product-actions">
                    <button className="action-btn delete" onClick={() => handleDeleteProduct(product)}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map(product => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-cell-img">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="product-cell-info">
                          <div className="product-cell-name">{product.name}</div>
                          <div className="product-cell-category">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>
                      <span className={`product-stock ${stockStatus.class}`}>{stockStatus.text}</span>
                    </td>
                    <td>{product.stock}</td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => handleViewProduct(product)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="action-btn edit" onClick={() => handleEditProduct(product)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDeleteProduct(product)}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination section */}
      <div className="pagination">
        <button 
          className="pagination-btn" 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
          // Show only current page, first, last, and one page before and after current
          if (
            pageNum === 1 ||
            pageNum === totalPages ||
            pageNum === currentPage ||
            pageNum === currentPage - 1 ||
            pageNum === currentPage + 1
          ) {
            return (
              <button 
                key={pageNum} 
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          }
          
          // Show ellipsis for gaps
          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
            return <span key={pageNum} className="pagination-ellipsis">...</span>;
          }
          
          return null;
        })}
        
        <button 
          className="pagination-btn" 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Product Details"
          size="medium"
          actions={
            <>
              <button onClick={() => setShowDetailsModal(false)} className="cancel-btn">Close</button>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEditProduct(selectedProduct);
                }} 
                className="save-btn"
              >
                Edit Product
              </button>
            </>
          }
        >
          <div className="product-details-content">
            <div className="product-detail-img">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            
            <div className="product-detail-info">
              <h4 className="product-detail-name">{selectedProduct.name}</h4>
              <p className="product-detail-category">Category: {selectedProduct.category}</p>
              <p className="product-detail-price">Price: ${selectedProduct.price.toFixed(2)}</p>
              <p className="product-detail-stock">Stock: {selectedProduct.stock}</p>
              <div className="product-detail-status">
                <span className={`product-stock ${getStockStatus(selectedProduct.stock).class}`}>
                  {getStockStatus(selectedProduct.stock).text}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          title="Edit Product"
          size="medium"
          actions={
            <>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button onClick={saveEditedProduct} className="save-btn">Save Changes</button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={editingProduct.name}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                value={editingProduct.category}
                onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
              >
                {productCategories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={editingProduct.stock}
                onChange={(e) => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProduct && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
          size="small"
          actions={
            <>
              <button onClick={() => setShowDeleteConfirm(false)} className="cancel-btn">Cancel</button>
              <button onClick={confirmDeleteProduct} className="save-btn bg-red-600 hover:bg-red-700">Delete</button>
            </>
          }
        >
          <p className="mb-4">Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.</p>
        </Modal>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            setNewCategory('');
          }}
          title="Manage Categories"
          size="large"
          actions={
            <button onClick={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
              setNewCategory('');
            }} className="save-btn">
              Done
            </button>
          }
        >
          <div className="category-form mb-4">
            <h4 className="text-lg font-medium mb-2">{editingCategory ? 'Edit Category' : 'Add New Category'}</h4>
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button 
              className="save-btn"
              onClick={editingCategory ? saveEditedCategory : handleAddCategory}
            >
              {editingCategory ? 'Update' : 'Add'}
            </button>
            {editingCategory && (
              <button 
                className="cancel-btn"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategory('');
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="categories-list">
            <h4 className="text-lg font-medium mb-2">Current Categories</h4>
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categories.map((category) => {
                  const productCount = products.filter(p => p.category === category).length;
                  return (
                    <div key={category} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-count">{productCount}</span>
                      </div>
                      <div className="category-actions">
                        <button 
                          className="action-btn edit"
                          onClick={() => handleEditCategory(category)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No categories found. Add some categories to get started.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <Modal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          title="Add New Product"
          size="large"
          actions={
            <>
              <button onClick={() => setShowAddProductModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddProduct} className="save-btn">Add Product</button>
            </>
          }
        >
          <div className="add-product-form">
            <div className="form-card">
              <h4 className="form-card-title">Product Information</h4>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Product Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category <span className="required">*</span></label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tax</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.tax}
                    onChange={(e) => setNewProduct({...newProduct, tax: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({...newProduct, cost: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Stock <span className="required">*</span></label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Minimum Stock <span className="required">*</span></label>
                  <input
                    type="number"
                    value={newProduct.minimumStock}
                    onChange={(e) => setNewProduct({...newProduct, minimumStock: parseInt(e.target.value)})}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Barcode Number</label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                    placeholder="Enter barcode number"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Enter product description"
                  rows={4}
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Product Image</label>
                <div className="image-upload-container">
                  <div className="image-upload-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="40" height="40">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="image-upload-text">Drag & drop image here</p>
                  <p className="image-upload-subtext">Supports: JPG, JPEG, PNG</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        // In a real app, you would handle file upload here
                        setNewProduct({...newProduct, image: URL.createObjectURL(e.target.files[0])})
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Products;