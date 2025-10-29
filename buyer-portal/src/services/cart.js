import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (listing, qtyKg = 1) => {
    setItems((prev) => {
      const existing = prev.find((x) => x.id === listing.id);
      if (existing) {
        return prev.map((x) => (x.id === listing.id ? { ...x, qtyKg: x.qtyKg + qtyKg } : x));
      }
      return [...prev, { id: listing.id, name: listing.name, price: listing.price, qtyKg, image: listing.image }];
    });
  };

  const updateQty = (id, qtyKg) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qtyKg } : x)));
  };

  const removeItem = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, x) => sum + x.price * x.qtyKg, 0);
    return { subtotal };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, totals }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}


