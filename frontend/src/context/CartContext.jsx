import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync cart from backend when token changes, merging guest cart if present
  useEffect(() => {
    const syncCart = async () => {
      if (token) {
        setLoading(true);
        try {
          const localGuestCart = JSON.parse(localStorage.getItem('technova_guest_cart') || '[]');
          if (localGuestCart.length > 0) {
            console.log('Merging guest cart into database...');
            const items = localGuestCart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity
            }));
            await API.post('/cart/merge', { items });
            localStorage.removeItem('technova_guest_cart');
          }
          await fetchCart();
        } catch (error) {
          console.error('Error syncing/merging cart:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Load guest cart from localStorage
        const localGuestCart = JSON.parse(localStorage.getItem('technova_guest_cart') || '[]');
        setCart(localGuestCart);
      }
    };
    syncCart();
  }, [token]);

  const fetchCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await API.get('/cart');
      setCart(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const qty = parseInt(quantity) || 1;

    if (!token) {
      // Guest add to cart in localStorage
      try {
        setLoading(true);
        // Get current product details for guest UI presentation
        const res = await API.get(`/products/${productId}`);
        const product = res.data;

        const localCart = JSON.parse(localStorage.getItem('technova_guest_cart') || '[]');
        const existingIdx = localCart.findIndex(item => item.product_id === parseInt(productId));

        if (existingIdx > -1) {
          const newQty = localCart[existingIdx].quantity + qty;
          if (newQty > product.stock) {
            setLoading(false);
            return { success: false, message: `Cannot add more. Only ${product.stock} items are in stock.` };
          }
          localCart[existingIdx].quantity = newQty;
        } else {
          if (qty > product.stock) {
            setLoading(false);
            return { success: false, message: `Cannot add. Only ${product.stock} items are in stock.` };
          }
          localCart.push({
            id: `guest_${Date.now()}`,
            product_id: parseInt(productId),
            quantity: qty,
            title: product.title,
            price: product.price,
            image_url: product.image_url,
            brand: product.brand,
            stock: product.stock
          });
        }

        localStorage.setItem('technova_guest_cart', JSON.stringify(localCart));
        setCart(localCart);
        setLoading(false);
        return { success: true, message: 'Added to cart as guest.' };
      } catch (err) {
        console.error('Error adding to guest cart:', err);
        setLoading(false);
        return { success: false, message: 'Failed to add item to guest cart.' };
      }
    }

    // Authenticated add to cart
    try {
      const res = await API.post('/cart', { product_id: productId, quantity: qty });
      setCart(res.data.cart);
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add item to cart.'
      };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return { success: false };

    if (!token) {
      // Guest update in localStorage
      const localCart = JSON.parse(localStorage.getItem('technova_guest_cart') || '[]');
      const itemIdx = localCart.findIndex(item => item.id === cartItemId);
      if (itemIdx > -1) {
        const item = localCart[itemIdx];
        if (qty > item.stock) {
          return { success: false, message: `Only ${item.stock} left in stock.` };
        }
        localCart[itemIdx].quantity = qty;
        localStorage.setItem('technova_guest_cart', JSON.stringify(localCart));
        setCart(localCart);
        return { success: true };
      }
      return { success: false, message: 'Item not found in guest cart.' };
    }

    // Authenticated update
    try {
      const res = await API.put(`/cart/${cartItemId}`, { quantity: qty });
      setCart(res.data.cart);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update quantity.'
      };
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!token) {
      // Guest remove from localStorage
      const localCart = JSON.parse(localStorage.getItem('technova_guest_cart') || '[]');
      const filteredCart = localCart.filter(item => item.id !== cartItemId);
      localStorage.setItem('technova_guest_cart', JSON.stringify(filteredCart));
      setCart(filteredCart);
      return { success: true };
    }

    // Authenticated remove
    try {
      const res = await API.delete(`/cart/${cartItemId}`);
      setCart(res.data.cart);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove item.'
      };
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('technova_guest_cart');
  };

  // Helper values
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        cartTotal,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
