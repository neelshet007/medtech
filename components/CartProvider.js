"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

function readInitialCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const savedCart = window.localStorage.getItem("medical_cart");
  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch (error) {
    console.error("Failed to parse cart", error);
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCart = window.localStorage.getItem("medical_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart", error);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem("medical_cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product._id === product._id);
      if (existing) {
        return current.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { product, quantity: 1, price: product.price }];
    });
  }

  function removeFromCart(productId) {
    setCart((current) => current.filter((item) => item.product._id !== productId));
  }

  function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.product._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  function getCartTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
