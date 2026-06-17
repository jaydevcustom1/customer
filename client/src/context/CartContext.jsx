import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const local = localStorage.getItem('qr_cart_items');
    return local ? JSON.parse(local) : [];
  });

  const [tableNumber, setTableNumber] = useState(() => {
    return localStorage.getItem('qr_table_number') || '';
  });

  const [tableId, setTableId] = useState(() => {
    return localStorage.getItem('qr_table_id') || '';
  });

  const [settings, setSettings] = useState({
    restaurantName: 'The Golden Plate Bistro',
    currency: 'USD',
    tax: 8.50,
    serviceFee: 10.00
  });

  const [lastReceipt, setLastReceipt] = useState(() => {
    return localStorage.getItem('qr_last_receipt') || '';
  });

  // Fetch settings from server
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${backendUrl}/api/settings`);
        if (res.data) {
          setSettings(res.data);
          document.title = `${res.data.restaurantName} | Instant QR Order & Menu`;
        }
      } catch (err) {
        console.error('Failed to load restaurant settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Auto-detect table query parameter from URL on any page entry
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      const fetchTable = async () => {
        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await axios.get(`${backendUrl}/api/tables`);
          const tables = res.data;
          const match = tables.find(t => t.tableNumber.toLowerCase() === tableParam.toLowerCase());
          if (match) {
            setTable(match.tableNumber, match.id);
          } else {
            setTable(tableParam, tableParam);
          }
        } catch (e) {
          console.warn('Could not match table from database:', e);
          setTable(tableParam, tableParam);
        }
      };
      fetchTable();
    }
  }, []);

  // Save cart items to local storage
  useEffect(() => {
    localStorage.setItem('qr_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  // Handle Table matching from query params
  const setTable = (number, id) => {
    setTableNumber(number);
    setTableId(id);
    localStorage.setItem('qr_table_number', number);
    localStorage.setItem('qr_table_id', id);
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingIndex].quantity += quantity;
        return newItems;
      }
      return [...prevItems, { product, quantity }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('qr_cart_items');
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const taxAmount = (subtotal * (Number(settings.tax) / 100));
  const serviceFeeAmount = (subtotal * (Number(settings.serviceFee) / 100));
  const total = subtotal + taxAmount + serviceFeeAmount;

  // Checkout order
  const checkout = async (customerName, notes) => {
    if (!tableId) {
      throw new Error('No table selected. Please scan the QR code again.');
    }
    if (!cartItems.length) {
      throw new Error('Your cart is empty.');
    }

    const itemsPayload = cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    try {
      const res = await axios.post(`${backendUrl}/api/orders/checkout`, {
        customerName,
        tableId,
        items: itemsPayload,
        notes
      });

      const orderData = res.data;
      
      // Save last receipt
      setLastReceipt(orderData.receiptNumber);
      localStorage.setItem('qr_last_receipt', orderData.receiptNumber);

      // Clear cart
      clearCart();

      return orderData;
    } catch (err) {
      console.error('Checkout API error:', err);
      throw new Error(err.response?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      tableNumber,
      tableId,
      settings,
      lastReceipt,
      setTable,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      taxAmount,
      serviceFeeAmount,
      total,
      checkout,
      setLastReceipt: (rec) => {
        setLastReceipt(rec);
        localStorage.setItem('qr_last_receipt', rec);
      }
    }}>
      {children}
    </CartContext.Provider>
  );
};
