import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { SketchPicker } from 'react-color';
import './Modal.css';

interface ExtendedProduct {
  name: string;
  category: string;
  price: number;
  stock: number;
  minimumStock: number;
  tax: number;
  cost: number;
  barcode: string;
  description: string;
  color: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<ExtendedProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: string[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  categories,
}) => {
  const [product, setProduct] = useState<Omit<ExtendedProduct, 'id' | 'createdAt' | 'updatedAt'>>({ 
    name: '', 
    category: categories.length > 0 ? categories[0] : '', 
    price: 0, 
    stock: 0, 
    minimumStock: 0, 
    tax: 0, 
    cost: 0, 
    barcode: '', 
    description: '', 
    color: '#7367f0' 
  });
  
  const [errors, setErrors] = useState<string[]>([]);

  // Update category when categories prop changes
  useEffect(() => {
    if (categories.length > 0 && !product.category) {
      setProduct(prev => ({ ...prev, category: categories[0] }));
    }
  }, [categories, product.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['price', 'stock', 'minimumStock', 'tax', 'cost'].includes(name)) {
      // Allow empty string for numeric fields so users can clear and type their own values
      if (value === '') {
        setProduct(prev => ({ ...prev, [name]: '' }));
      } else {
        const numValue = parseFloat(value);
        setProduct(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
      }
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleColorChange = (color: { hex: string }) => {
    setProduct(prev => ({ ...prev, color: color.hex }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (product.name.trim() === '') {
      newErrors.push('Product name is required');
    }
    
    if (!product.category) {
      newErrors.push('Category is required');
    }
    
    // Check if price is empty string or less than or equal to 0
    if (product.price === '') {
      newErrors.push('Price is required');
    } else if (Number(product.price) <= 0) {
      newErrors.push('Price must be greater than 0');
    }
    
    // Check if stock is empty string or negative
    if (product.stock === '') {
      newErrors.push('Current stock is required');
    } else if (Number(product.stock) < 0) {
      newErrors.push('Stock cannot be negative');
    }
    
    // Check if minimumStock is empty string or negative
    if (product.minimumStock === '') {
      // Empty minimum stock is allowed, set to 0
      setProduct(prev => ({ ...prev, minimumStock: 0 }));
    } else if (Number(product.minimumStock) < 0) {
      newErrors.push('Minimum stock cannot be negative');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Convert any empty string values to 0 before submitting
      const productToSubmit = {
        ...product,
        price: product.price === '' ? 0 : Number(product.price),
        stock: product.stock === '' ? 0 : Number(product.stock),
        minimumStock: product.minimumStock === '' ? 0 : Number(product.minimumStock),
        tax: product.tax === '' ? 0 : Number(product.tax),
        cost: product.cost === '' ? 0 : Number(product.cost)
      };
      
      onAddProduct(productToSubmit);
      resetForm();
      
      // Show success toast if window.toast is available
      if (window.toast) {
        window.toast.success('Product added successfully');
      }
    } else if (window.toast) {
      // Show error toast if there are validation errors and window.toast is available
      window.toast.error('Please fix the errors before submitting');
    }
  };

  const resetForm = () => {
    setProduct({ 
      name: '', 
      category: categories.length > 0 ? categories[0] : '', 
      price: 0, 
      stock: 0, 
      minimumStock: 0, 
      tax: 0, 
      cost: 0, 
      barcode: '', 
      description: '', 
      color: '#7367f0' 
    });
    setErrors([]);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product"
      size="large"
      actions={
        <>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleSubmit} className="save-btn">Add Product</button>
        </>
      }
    >
      <div className="add-product-form">
        {errors.length > 0 && (
          <div className="error-message-box">
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-card">
          <h4 className="form-card-title">Product Information</h4>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="name">Product Name <span className="required">*</span></label>
              <input
                id="name"
                name="name"
                type="text"
                value={product.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="category">Category <span className="required">*</span></label>
              <select
                id="category"
                name="category"
                value={product.category}
                onChange={handleInputChange}
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
              <label htmlFor="price">Price <span className="required">*</span></label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={product.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="tax">Tax</label>
              <input
                id="tax"
                name="tax"
                type="number"
                step="0.01"
                value={product.tax}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="cost">Cost</label>
              <input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                value={product.cost}
                onChange={handleInputChange}
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="barcode">Barcode</label>
              <input
                id="barcode"
                name="barcode"
                type="text"
                value={product.barcode}
                onChange={handleInputChange}
                placeholder="Enter barcode"
              />
            </div>
          </div>
        </div>
        
        <div className="form-card">
          <h4 className="form-card-title">Inventory Information</h4>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="stock">Current Stock <span className="required">*</span></label>
              <input
                id="stock"
                name="stock"
                type="number"
                value={product.stock}
                onChange={handleInputChange}
                placeholder="0"
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="minimumStock">Minimum Stock</label>
              <input
                id="minimumStock"
                name="minimumStock"
                type="number"
                value={product.minimumStock}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
              rows={3}
            />
          </div>
        </div>
        
        <div className="form-card">
          <h4 className="form-card-title">Product Appearance</h4>
          
          <div className="form-group">
            <label>Product Color</label>
            <div className="color-picker-container">
              <div 
                className="color-preview" 
                style={{ 
                  backgroundColor: product.color, 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '4px', 
                  marginBottom: '10px', 
                  border: '1px solid #ddd' 
                }}
              ></div>
              <SketchPicker
                color={product.color}
                onChangeComplete={handleColorChange}
                disableAlpha={true}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddProductModal;