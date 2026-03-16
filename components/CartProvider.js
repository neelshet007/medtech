"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session, status } = useSession();
  const [cart, setCart] = useState(readInitialCart);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState([]);

  useEffect(() => {
    window.localStorage.setItem("medical_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    async function syncCart() {
      if (status !== "authenticated" || !session?.user?.id) {
        return;
      }

      setIsCartLoading(true);

      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load cart.");
        }

        let mergedCart = result.cart || [];

        // Merge anonymous cart data into the authenticated database cart once per login session.
        // The browser cart gives the user continuity before login, while the API cart becomes the
        // durable source of truth once authentication exists.
        for (const localItem of cart) {
          const existing = mergedCart.find((item) => item.product?._id === localItem.product._id);
          const nextQuantity = (existing?.quantity || 0) + localItem.quantity;

          const updateResponse = await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: localItem.product._id,
              quantity: nextQuantity,
            }),
          });
          const updateResult = await updateResponse.json();

          if (updateResponse.ok && updateResult.success) {
            mergedCart = updateResult.cart;
          }
        }

        setCart(
          mergedCart.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.product.price,
          }))
        );
      } catch (error) {
        console.error("Cart sync failed", error);
      } finally {
        setIsCartLoading(false);
      }
    }

    syncCart();
    // The cart merge should run when the auth state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);

  async function persistQuantity(product, quantity) {
    if (!session?.user?.id) {
      return;
    }

    setPendingProductIds((current) => [...new Set([...current, product._id])]);

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update cart.");
      }

      setCart(
        result.cart.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );
    } catch (error) {
      console.error("Cart update failed", error);
    } finally {
      setPendingProductIds((current) => current.filter((id) => id !== product._id));
    }
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product._id === product._id);
      const nextCart = existing
        ? current.map((item) =>
            item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...current, { product, quantity: 1, price: product.price }];

      const nextQuantity = nextCart.find((item) => item.product._id === product._id)?.quantity || 1;
      void persistQuantity(product, nextQuantity);
      return nextCart;
    });
  }

  function removeFromCart(productId) {
    setCart((current) => {
      const target = current.find((item) => item.product._id === productId);
      if (target) {
        void persistQuantity(target.product, 0);
      }
      return current.filter((item) => item.product._id !== productId);
    });
  }

  function updateQuantity(productId, newQuantity) {
    setCart((current) => {
      const target = current.find((item) => item.product._id === productId);
      if (!target) {
        return current;
      }

      if (newQuantity < 1) {
        void persistQuantity(target.product, 0);
        return current.filter((item) => item.product._id !== productId);
      }

      void persistQuantity(target.product, newQuantity);
      return current.map((item) =>
        item.product._id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }

  async function clearCart() {
    setCart([]);

    if (session?.user?.id) {
      try {
        await fetch("/api/cart", { method: "DELETE" });
      } catch (error) {
        console.error("Failed to clear cart", error);
      }
    }
  }

  function getCartTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  function getItemQuantity(productId) {
    return cart.find((item) => item.product._id === productId)?.quantity || 0;
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
        getItemQuantity,
        isCartLoading,
        pendingProductIds,
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
