"use client";

import { useCart } from "@/components/CartProvider";
import Link from "next/link";
import { ArrowLeft, Trash2, Edit3, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, itemCount } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto view-container">
        
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/patient/products" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <ShoppingBag size={64} className="text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-6">Looks like you haven't added any medical supplies yet.</p>
            <Link href="/patient/products" className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.product._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 truncate">{item.product.name}</h3>
                    <p className="text-sm text-teal-600 font-medium">₹{item.price}</p>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 font-medium min-w-[32px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.product._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-medium text-slate-900">₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-teal-600 text-sm">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-slate-900 mb-6 pt-4 border-t border-slate-100">
                <span>Total</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>

              <Link href="/patient/checkout" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition">
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
