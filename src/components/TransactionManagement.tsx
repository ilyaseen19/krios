import React, { useState } from 'react';
import { Product, CartItem } from '../types/product';
import { getProducts } from '../services/productService';
import { createTransaction } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { usePriceFormatter } from '../utils/priceUtils';

const TransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatPrice } = usePriceFormatter();

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setError('Product out of stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError('Not enough stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Update product stock
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, stock: p.stock - 1 } : p
    ));
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    if (item.quantity > 1) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.id !== productId));
    }

    // Restore product stock
    setProducts(products.map(p =>
      p.id === productId ? { ...p, stock: p.stock + 1 } : p
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax rate
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      // Get the username from localStorage instead of user object
      const cashierId = localStorage.getItem('username') || 'unknown';
      await createTransaction(cart, cashierId);
      setCart([]);
      loadProducts(); // Reload products to get updated stock
    } catch (err) {
      setError('Failed to complete transaction');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {/* Products List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Products</h2>
        <div className="grid grid-cols-1 gap-4">
          {products.map(product => (
            <div key={product.id} className="p-4 border rounded">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p>Price: {formatPrice(product.price)}</p>
              <p>Stock: {product.stock}</p>
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`mt-2 px-4 py-2 rounded ${product.stock <= 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Cart</h2>
        <div className="border rounded p-4">
          {cart.map(item => (
            <div key={item.id} className="mb-4 p-2 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: {formatPrice(item.price * item.quantity)}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="mt-4">
              <div className="text-lg">
                <p>Subtotal: {formatPrice(calculateSubtotal())}</p>
                <p>Tax (10%): {formatPrice(calculateTax())}</p>
                <p className="font-bold">Total: {formatPrice(calculateTotal())}</p>
              </div>
              <button
                onClick={handleCheckout}
                className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Complete Transaction
              </button>
            </div>
          )}

          {cart.length === 0 && (
            <p className="text-center text-gray-500">Cart is empty</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;