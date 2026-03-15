"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/components/CartProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Load Razorpay Script dynamically safely
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpay();
  }, []);

  const handlePayment = async () => {
    if (!session?.user?.id) {
      setError("Please login to proceed with checkout.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          totalAmount: getCartTotal(),
          userId: session.user.id,
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      // 2. Initialize Razorpay UI
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourTestKey", // Provide public key
        amount: data.razorpayOrder.amount,
        currency: "INR",
        name: "Medical Pharmacy",
        description: "Health & Medicine Purchase",
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/payments/verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                internal_order_id: data.orderId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              clearCart();
              router.push(`/patient/success?order_id=${data.orderId}`);
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            setError("Something went wrong during verification.");
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#0D9488", // Teal color matching our theme
        },
      };

      const rzp1 = new window.Razorpay(options);
      
      rzp1.on("payment.failed", function (response) {
        setError(response.error.description);
      });

      rzp1.open();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Checkout unavailable</h2>
        <p className="text-slate-500 mb-6">Your cart is currently empty. Add medicines to proceed.</p>
        <Link href="/patient/products" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center space-x-4">
          <Link href="/patient/cart" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Checkout Security</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Summary</h2>
              <div className="space-y-3 mb-6">
                {cart.map(item => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.quantity}x {item.product.name}</span>
                    <span className="font-medium text-slate-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-4 border-t border-slate-100 mb-6">
                <span>Total Amount Payable</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>
              <button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                {isProcessing ? "Processing..." : `Pay ₹${getCartTotal().toFixed(2)}`}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-teal-400" size={32} />
              <h2 className="font-bold text-lg">Secure Razorpay Gateway</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your payments are processed dynamically via Razorpay's AES-256 encrypted servers. We do not store any credit card information on our servers. The backend creates a unique token linked to standard Webhook implementations. Verification is completed natively against cryptographic HMACs.
            </p>
            <div className="flex gap-4 opacity-50">
              <div className="w-12 h-8 bg-slate-700 rounded bg-center bg-contain bg-no-repeat" style={{backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg')"}} />
              <div className="w-12 h-8 bg-slate-700 rounded bg-center bg-contain bg-no-repeat" style={{backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg')"}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
