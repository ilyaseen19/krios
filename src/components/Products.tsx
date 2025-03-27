import React, { useState, useEffect } from 'react';
import { sortOptions } from '../data/mockProducts';
import { Product } from '../types/product';
import './Products.css';
import { Modal, AddProductModal, EditProductModal, ManageCategoriesModal, DeleteConfirmationModal } from './modals';
import Table from './Table';
import { SketchPicker } from 'react-color';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService.offline';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../services/categoryService.offline';
import { calculateTotalInventoryCost, calculateTotalStockValue, calculatePotentialProfit, calculateExpectedRevenue, countTotalProductUnits, countLowStockItems } from '../utils/inventoryUtils';
import { usePriceFormatter } from '../utils/priceUtils';

// Extended Product interface to match the mockProducts structure
interface ExtendedProduct extends Product {
  category: string;
  minimumStock: number;
  tax: number;
  cost: number;
  barcode: string;
  color: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<ExtendedProduct, 'id' | 'createdAt' | 'updatedAt'>>({ 
    name: '', 
    category: categories[0] || '', 
    price: 0, 
    stock: 0, 
    minimumStock: 0, 
    tax: 0, 
    cost: 0, 
    barcode: '', 
    description: '', 
    color: '#7367f0' 
  });
  const productsPerPage = 8;
  
  // Use the price formatter
  const { formatPrice } = usePriceFormatter();
  
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
  const getStockStatus = (stock: number, minimumStock: number = 10) => {
    if (stock === 0) return { class: 'stock-low', text: 'Out of Stock' };
    if (stock < minimumStock) return { class: 'stock-medium', text: 'Low Stock' };
    return { class: 'stock-high', text: 'In Stock' };
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
  
  // Load products and categories from IndexedDB on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingCategories(true);
        
        // Load products
        const productsData = await getProducts();
        // Convert the Product type to ExtendedProduct with default values for missing fields
        const extendedProducts: ExtendedProduct[] = productsData.map(product => ({
          ...product,
          category: (product as any).category || 'Uncategorized',
          minimumStock: (product as any).minimumStock || 0,
          tax: (product as any).tax || 0,
          cost: (product as any).cost || 0,
          barcode: (product as any).barcode || '',
          color: (product as any).color || '#7367f0'
        }));
        setProducts(extendedProducts);
        
        // Load categories
        const categoriesData = await getCategories();
        if (categoriesData.length > 0) {
          setCategories(categoriesData.map(cat => cat.name));
        } else {
          // If no categories exist, create default ones
          const defaultCategories = ['Electronics', 'Accessories', 'Clothing'];
          const createdCategories: string[] = [];
          
          for (const catName of defaultCategories) {
            try {
              const newCat = await createCategory(catName);
              createdCategories.push(newCat.name);
            } catch (err) {
              console.error(`Failed to create default category ${catName}:`, err);
            }
          }
          
          setCategories(createdCategories);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    loadData();
  }, []);

  // Confirm delete product
  const confirmDeleteProduct = async () => {
    if (selectedProduct) {
      try {
        await deleteProduct(selectedProduct.id);
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        setShowDeleteConfirm(false);
      } catch (err) {
        console.error('Failed to delete product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };
  
  // Save edited product
  const saveEditedProduct = async () => {
    if (editingProduct) {
      try {
        const updatedProduct = await updateProduct(editingProduct.id, editingProduct);
        // Use the updatedProduct directly from the database to ensure consistency
        const extendedUpdatedProduct = {
          ...updatedProduct,
          category: (updatedProduct as any).category || 'Uncategorized',
          minimumStock: (updatedProduct as any).minimumStock || 0,
          tax: (updatedProduct as any).tax || 0,
          cost: (updatedProduct as any).cost || 0,
          barcode: (updatedProduct as any).barcode || '',
          color: (updatedProduct as any).color || '#7367f0'
        };
        
        // Update products state
        setProducts(products.map(p => p.id === updatedProduct.id ? extendedUpdatedProduct : p));
        
        // Check if product is low on stock or out of stock
        if (extendedUpdatedProduct.stock === 0) {
          if (window.toast) {
            window.toast.warning(`${extendedUpdatedProduct.name} is out of stock!`);
          }
        } else if (extendedUpdatedProduct.stock < extendedUpdatedProduct.minimumStock) {
          if (window.toast) {
            window.toast.warning(`${extendedUpdatedProduct.name} is low on stock!`);
          }
        }
        
        setShowEditModal(false);
        setEditingProduct(null);
      } catch (err) {
        console.error('Failed to update product:', err);
        if (window.toast) {
          window.toast.error('Failed to update product. Please try again.');
        } else {
          alert('Failed to update product. Please try again.');
        }
      }
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (newCategory.trim() !== '' && !categories.includes(newCategory.trim())) {
      try {
        await createCategory(newCategory.trim());
        setCategories([...categories, newCategory.trim()]);
        setNewCategory('');
      } catch (err) {
        console.error('Failed to add category:', err);
        alert('Failed to add category. Please try again.');
      }
    }
  };

  // Edit category
  const handleEditCategory = (oldCategory: string) => {
    setEditingCategory(oldCategory);
    setNewCategory(oldCategory);
  };

  // Save edited category
  const saveEditedCategory = async () => {
    if (editingCategory && newCategory.trim() !== '') {
      try {
        // Find the category ID
        const categoriesData = await getCategories();
        const categoryToUpdate = categoriesData.find(cat => cat.name === editingCategory);
        
        if (categoryToUpdate) {
          // Update category in IndexedDB
          await updateCategory(categoryToUpdate.id, newCategory.trim());
          
          // Update category in categories list
          const updatedCategories = categories.map(cat => 
            cat === editingCategory ? newCategory.trim() : cat
          );
          setCategories(updatedCategories);

          // Update category in products
          const updatedProducts = await Promise.all(products.map(async product => {
            if (product.category === editingCategory) {
              const updatedProduct = { ...product, category: newCategory.trim() };
              await updateProduct(product.id, updatedProduct as any);
              return updatedProduct;
            }
            return product;
          }));
          setProducts(updatedProducts);

          // Reset state
          setEditingCategory(null);
          setNewCategory('');
        }
      } catch (err) {
        console.error('Failed to update category:', err);
        alert('Failed to update category. Please try again.');
      }
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will remove the category from all products.`)) {
      try {
        // Find the category ID
        const categoriesData = await getCategories();
        const categoryToRemove = categoriesData.find(cat => cat.name === categoryToDelete);
        
        if (categoryToRemove) {
          // Delete category from IndexedDB
          await deleteCategory(categoryToRemove.id);
          
          // Remove category from list
          const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
          setCategories(updatedCategories);

          // Update products with this category to use the first available category or empty string
          const defaultCategory = updatedCategories.length > 0 ? updatedCategories[0] : '';
          const updatedProducts = await Promise.all(products.map(async product => {
            if (product.category === categoryToDelete) {
              const updatedProduct = { ...product, category: defaultCategory };
              await updateProduct(product.id, updatedProduct as any);
              return updatedProduct;
            }
            return product;
          }));
          setProducts(updatedProducts);
        }
      } catch (err) {
        console.error('Failed to delete category:', err);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  // Add new product
  const handleAddProduct = async (productData: Omit<ExtendedProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Create product in IndexedDB
      const createdProduct = await createProduct({
        name: productData.name,
        price: productData.price,
        stock: productData.stock,
        description: productData.description,
        // Add the extended properties
        category: productData.category,
        minimumStock: productData.minimumStock,
        tax: productData.tax,
        cost: productData.cost,
        barcode: productData.barcode,
        color: productData.color
      } as any);
      
      // Create extended product with all properties
      const extendedProduct = {
        ...createdProduct,
        category: productData.category,
        minimumStock: productData.minimumStock,
        tax: productData.tax,
        cost: productData.cost,
        barcode: productData.barcode,
        color: productData.color
      };
      
      // Add the new product to the state
      setProducts([...products, extendedProduct]);
      
      // Check if product is low on stock or out of stock
      if (extendedProduct.stock === 0) {
        if (window.toast) {
          window.toast.warning(`${extendedProduct.name} is out of stock!`);
        }
      } else if (extendedProduct.stock < extendedProduct.minimumStock) {
        if (window.toast) {
          window.toast.warning(`${extendedProduct.name} is low on stock!`);
        }
      }
      
      // Close the modal
      setShowAddProductModal(false);
    } catch (err) {
      console.error('Failed to add product:', err);
      if (window.toast) {
        window.toast.error('Failed to add product. Please try again.');
      } else {
        alert('Failed to add product. Please try again.');
      }
    }
  };

  return (
    <div className="products-container">
      {loading && <div className="loading-indicator">Loading products...</div>}
      {error && <div className="error-message">{error}</div>}
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
              <span className="stat-value">{countTotalProductUnits(products)}</span>
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
              <span className="stat-value">{categories.length}</span>
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
              <span className="stat-value">{formatPrice(calculateTotalInventoryCost(products))}</span>
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
              <span className="stat-value">{formatPrice(calculateExpectedRevenue(products))}</span>
            </div>
          </div>
        </div>
        <div className="category-breakdown">
          <h4 className="breakdown-title">Products by Category</h4>
          <div className="category-stats">
            {categories.map(category => {
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
            {categories.map((category, index) => (
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
                  <p className="product-price">{formatPrice(product.price)}</p>
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
        <Table
          columns={[
            {
              header: 'Product',
              accessor: (product) => (
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
              )
            },
            {
              header: 'Category',
              accessor: 'category'
            },
            {
              header: 'Price',
              accessor: (product) => formatPrice(product.price)
            },
            {
              header: 'Stock',
              accessor: (product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <span className={`product-stock ${stockStatus.class}`}>{stockStatus.text}</span>
                );
              }
            },
            {
              header: 'Quantity',
              accessor: 'stock'
            },
            {
              header: 'Actions',
              accessor: (product) => (
                <div className="actions-cell">
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
                </div>
              ),
              className: 'actions-cell'
            }
          ]}
          data={currentProducts}
          className="products-table-container"
          tableClassName="products-table"
          emptyMessage="No products found matching your filters"
        />
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
            <div className="product-detail-img" style={{ backgroundColor: selectedProduct.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>Color Preview</div>
            </div>
            
            <div className="product-detail-info">
              <h4 className="product-detail-name">{selectedProduct.name}</h4>
              <p className="product-detail-category">Category: {selectedProduct.category}</p>
              <p className="product-detail-price">Price: {formatPrice(selectedProduct.price)}</p>
              <p className="product-detail-stock">Stock: {selectedProduct.stock}</p>
              <p className="product-detail-color">Color: <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: selectedProduct.color, borderRadius: '4px', verticalAlign: 'middle', marginLeft: '5px', border: '1px solid #ddd' }}></span></p>
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
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        onSaveProduct={saveEditedProduct}
        product={editingProduct as ExtendedProduct}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProduct && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDeleteProduct}
          itemName={selectedProduct.name}
          itemType="product"
        />
      )}

      {/* Category Management Modal */}
      <ManageCategoriesModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setNewCategory('');
        }}
        categories={categories}
        onCategoriesChange={(updatedCategories) => {
          setCategories(updatedCategories);
        }}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onAddProduct={handleAddProduct}
        categories={categories}
      />
    </div>
  );
};

export default Products;
