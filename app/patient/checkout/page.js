"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, CreditCard, FileText, Loader2, ShieldCheck, ShoppingBag, UploadCloud } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { cart, getCartTotal, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [isVerifyingPrescription, setIsVerifyingPrescription] = useState(false);
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);

  const requiresPrescription = cart.some(item => item.product.requiresPrescription);

  useEffect(() => {
    function loadRazorpay() {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    }

    loadRazorpay();
  }, []);

  async function handleVerifyPrescription() {
    if (!prescriptionFile) return;
    setIsVerifyingPrescription(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", prescriptionFile);
      const res = await fetch("/api/prescription/parse", { method: "POST", body: formData });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to verify prescription");
      }
      
      setPrescriptionVerified(true);
      setError(""); // clear any existing errors
    } catch (err) {
      setError(err.message || "Failed to connect to AI server");
    } finally {
      setIsVerifyingPrescription(false);
    }
  }

  async function handlePayment() {
    if (!session?.user?.id) {
      setError("Please Sign In before placing an order.");
      return;
    }

    if (requiresPrescription && !prescriptionVerified) {
      setError("Please upload and verify your prescription before proceeding to payment.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: cart,
          prescriptionUrl: prescriptionVerified ? "verified_by_ai" : null 
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create order.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourTestKey",
        amount: data.razorpayOrder.amount,
        currency: "INR",
        name: "Medical Pharmacy",
        description: "Health and Medicine Purchase",
        order_id: data.razorpayOrder.id,
        handler: async function (paymentResponse) {
          try {
            const verifyResponse = await fetch("/api/payments/verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                internal_order_id: data.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed.");
            }

            clearCart();
            router.push(`/patient/success?order_id=${data.orderId}`);
          } catch (verificationError) {
            setError(verificationError.message || "Something went wrong during verification.");
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#0D9488",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (paymentError) {
        setError(paymentError.error.description);
      });
      razorpay.open();
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setIsProcessing(false);
    }
  }

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
        {!session?.user ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-800">
            Please Sign In before placing an order.
          </div>
        ) : null}

        <div className="flex items-center space-x-4">
          <Link href="/patient/cart" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Checkout Security</h1>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-4">Summary</h2>
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.product._id} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item.quantity}x {item.product.name}
                      {item.product.requiresPrescription && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Rx API</span>
                      )}
                    </span>
                    <span className="font-medium text-slate-900">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {requiresPrescription && !prescriptionVerified && (
                <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                    <FileText size={18} />
                    Prescription Required
                  </div>
                  <p className="text-sm text-red-600 mb-3">One or more items in your cart require a valid medical prescription.</p>
                  <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-red-300 rounded-lg bg-white cursor-pointer hover:bg-red-50 transition">
                    <UploadCloud size={20} className="text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-600">
                      {prescriptionFile ? prescriptionFile.name : "Select Prescription"}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setPrescriptionFile(e.target.files[0])}
                      accept="image/*,.pdf" 
                    />
                  </label>
                  {prescriptionFile && (
                    <button
                      onClick={handleVerifyPrescription}
                      disabled={isVerifyingPrescription}
                      className="w-full mt-3 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isVerifyingPrescription ? <Loader2 className="animate-spin" size={16} /> : null}
                      Verify with AI
                    </button>
                  )}
                </div>
              )}

              {requiresPrescription && prescriptionVerified && (
                <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50 flex items-center gap-2 text-teal-800">
                  <ShieldCheck size={20} className="text-teal-600" />
                  <span className="text-sm font-bold">Prescription Verified by AI</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-4 border-t border-slate-100 mb-6">
                <span>Total Amount Payable</span>
                <span>Rs. {getCartTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !session?.user || (requiresPrescription && !prescriptionVerified)}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                {isProcessing ? "Processing..." : `Pay Rs. ${getCartTotal().toFixed(2)}`}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="text-teal-400" size={32} />
              <h2 className="font-bold text-lg">Secure Razorpay Gateway</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Your payment amount is recalculated from the live product collection on the server. Signature verification happens server-side before stock is reduced.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
