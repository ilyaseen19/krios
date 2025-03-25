import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { SketchPicker } from 'react-color';
import './Modal.css';

interface ExtendedProduct {
  id: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: ExtendedProduct) => void;
  product: ExtendedProduct | null;
  categories: string[];
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  product,
  categories,
}) => {
  const [editedProduct, setEditedProduct] = useState<ExtendedProduct | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Initialize form with product data when modal opens or product changes
  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
    }
  }, [product, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editedProduct) return;
    
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['price', 'stock', 'minimumStock', 'tax', 'cost'].includes(name)) {
      // Allow empty string for numeric fields so users can clear and type their own values
      if (value === '') {
        setEditedProduct(prev => prev ? { ...prev, [name]: '' } : null);
      } else {
        const numValue = parseFloat(value);
        setEditedProduct(prev => prev ? { ...prev, [name]: isNaN(numValue) ? 0 : numValue } : null);
      }
    } else {
      setEditedProduct(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleColorChange = (color: { hex: string }) => {
    if (!editedProduct) return;
    setEditedProduct(prev => prev ? { ...prev, color: color.hex } : null);
  };

  const validateForm = (): boolean => {
    if (!editedProduct) return false;
    
    const newErrors: string[] = [];
    
    if (editedProduct.name.trim() === '') {
      newErrors.push('Product name is required');
    }
    
    if (!editedProduct.category) {
      newErrors.push('Category is required');
    }
    
    // Check if price is empty string or less than or equal to 0
    if (editedProduct.price === '') {
      newErrors.push('Price is required');
    } else if (Number(editedProduct.price) <= 0) {
      newErrors.push('Price must be greater than 0');
    }
    
    // Check if stock is empty string or negative
    if (editedProduct.stock === '') {
      newErrors.push('Current stock is required');
    } else if (Number(editedProduct.stock) < 0) {
      newErrors.push('Stock cannot be negative');
    }
    
    // Check if minimumStock is empty string or negative
    if (editedProduct.minimumStock === '') {
      // Empty minimum stock is allowed, set to 0
      setEditedProduct(prev => prev ? { ...prev, minimumStock: 0 } : null);
    } else if (Number(editedProduct.minimumStock) < 0) {
      newErrors.push('Minimum stock cannot be negative');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!editedProduct) return;
    
    if (validateForm()) {
      // Convert any empty string values to 0 before submitting
      const productToSubmit = {
        ...editedProduct,
        price: editedProduct.price === '' ? 0 : Number(editedProduct.price),
        stock: editedProduct.stock === '' ? 0 : Number(editedProduct.stock),
        minimumStock: editedProduct.minimumStock === '' ? 0 : Number(editedProduct.minimumStock),
        tax: editedProduct.tax === '' ? 0 : Number(editedProduct.tax),
        cost: editedProduct.cost === '' ? 0 : Number(editedProduct.cost)
      };
      
      onSaveProduct(productToSubmit);
      
      // Show success toast if window.toast is available
      if (window.toast) {
        window.toast.success('Product updated successfully');
      }
    } else if (window.toast) {
      // Show error toast if there are validation errors and window.toast is available
      window.toast.error('Please fix the errors before submitting');
    }
  };

  // If no product is provided, don't render the modal
  if (!editedProduct) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      size="large"
      actions={
        <>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleSubmit} className="save-btn">Save Changes</button>
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
                value={editedProduct.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category <span className="required">*</span></label>
              <select
                id="category"
                name="category"
                value={editedProduct.category}
                onChange={handleInputChange}
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price <span className="required">*</span></label>
              <input
                id="price"
                name="price"
                type="number"
                value={editedProduct.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cost">Cost</label>
              <input
                id="cost"
                name="cost"
                type="number"
                value={editedProduct.cost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tax">Tax (%)</label>
              <input
                id="tax"
                name="tax"
                type="number"
                value={editedProduct.tax}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock">Current Stock <span className="required">*</span></label>
              <input
                id="stock"
                name="stock"
                type="number"
                value={editedProduct.stock}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="minimumStock">Minimum Stock</label>
              <input
                id="minimumStock"
                name="minimumStock"
                type="number"
                value={editedProduct.minimumStock}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="barcode">Barcode</label>
              <input
                id="barcode"
                name="barcode"
                type="text"
                value={editedProduct.barcode}
                onChange={handleInputChange}
                placeholder="Enter barcode"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={editedProduct.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Product Color</label>
              <div className="color-picker-container">
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: editedProduct.color }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input 
                  type="text" 
                  value={editedProduct.color} 
                  readOnly 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                {showColorPicker && (
                  <div className="color-picker-popover">
                    <div 
                      className="color-picker-cover" 
                      onClick={() => setShowColorPicker(false)}
                    />
                    <SketchPicker 
                      color={editedProduct.color} 
                      onChange={handleColorChange} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditProductModal;