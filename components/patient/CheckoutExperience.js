"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  BadgeIndianRupee,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  UploadCloud,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatCurrency } from "@/lib/formatters";

const paymentChoices = [
  {
    value: "Razorpay",
    label: "Razorpay (Online Payment)",
    description: "Pay now and confirm the order after server-side signature verification.",
  },
  {
    value: "COD",
    label: "Cash on Delivery (COD)",
    description: "Place the order directly and keep payment pending until delivery.",
  },
];

export function CheckoutExperience() {
  const { data: session } = useSession();
  const { cart, getCartTotal, clearCart, addToCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [isVerifyingPrescription, setIsVerifyingPrescription] = useState(false);
  const [prescriptionVerified, setPrescriptionVerified] = useState(false);
  const [parsedMedicines, setParsedMedicines] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);

  const requiresPrescription = cart.some((item) => item.product.requiresPrescription);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleVerifyPrescription() {
    if (!prescriptionFile) {
      return;
    }

    setIsVerifyingPrescription(true);
    setError("");

    try {
      const buffer = await prescriptionFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_PRESCRIPTION_WEBHOOK_URL;
      let prescriptionData = null;

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64,
            fileType: prescriptionFile.type,
            fileName: prescriptionFile.name,
            userId: session?.user?.id,
          }),
        });
        prescriptionData = await response.json();
      } else {
        const formData = new FormData();
        formData.append("file", prescriptionFile);
        const response = await fetch("/api/prescription/parse", { method: "POST", body: formData });
        prescriptionData = await response.json();
      }

      if (!prescriptionData.success) {
        throw new Error(prescriptionData.message || "Failed to verify prescription.");
      }

      setParsedMedicines(prescriptionData.parsedMedicines || []);
      setMatchedProducts(prescriptionData.matchedProducts || []);
      setPrescriptionVerified(true);
      setToast("Prescription verified successfully.");

      if (prescriptionData.matchedProducts?.length > 0) {
        prescriptionData.matchedProducts.forEach((product) => {
          addToCart(product);
        });
      }
    } catch (verificationError) {
      setError(verificationError.message || "Prescription verification failed.");
    } finally {
      setIsVerifyingPrescription(false);
    }
  }

  async function handlePayment() {
    if (!session?.user?.id) {
      setError("Please sign in before placing an order.");
      return;
    }

    if (requiresPrescription && !prescriptionVerified) {
      setError("Please upload and verify your prescription before placing the order.");
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
          paymentMethod,
          prescriptionUrl: prescriptionVerified ? "verified_by_ai" : null,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create order.");
      }

      if (paymentMethod === "COD") {
        clearCart();
        router.push(`/patient/success?order_id=${data.orderId}&method=cod`);
        return;
      }

      if (!window.Razorpay || !data.razorpayOrder) {
        throw new Error("Razorpay checkout is unavailable right now.");
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: data.razorpayOrder.amount,
        currency: "INR",
        name: "Medical Pharmacy",
        description: "Health and Medicine Purchase",
        order_id: data.razorpayOrder.id,
        handler: async (paymentResponse) => {
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
            router.push(`/patient/success?order_id=${data.orderId}&method=razorpay`);
          } catch (verificationError) {
            setError(verificationError.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: session.user.name || "",
          email: session.user.email || "",
        },
        theme: {
          color: "#0284c7",
        },
      });

      razorpay.on("payment.failed", (paymentError) => {
        setError(paymentError.error?.description || "Payment failed.");
      });
      razorpay.open();
    } catch (paymentError) {
      setError(paymentError.message || "Unable to place order.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <ShoppingBag size={64} className="mb-4 text-slate-300" />
        <h2 className="mb-2 text-xl font-bold text-slate-800">Checkout unavailable</h2>
        <p className="mb-6 text-slate-500">Your cart is currently empty. Add medicines to proceed.</p>
        <Link href="/patient/products" className="rounded-lg bg-teal-600 px-6 py-2 font-medium text-white transition hover:bg-teal-700">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-6">
        {!session?.user ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-800">
            Please sign in before placing an order.
          </div>
        ) : null}

        <div className="flex items-center space-x-4">
          <Link href="/dashboard/cart" className="rounded-full bg-white p-2 shadow-sm transition hover:shadow-md">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500">
              Payment handling is explicit: Razorpay verifies payment before stock reduction, COD places the order with
              a pending payment state and sends notifications immediately.
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">Order summary</h2>
            <div className="mt-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product._id} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-600">
                    {item.quantity}x {item.product.name}
                    {item.product.requiresPrescription ? (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700">Rx</span>
                    ) : null}
                  </span>
                  <span className="font-medium text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {requiresPrescription && !prescriptionVerified ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-bold text-red-700">
                  <FileText size={18} />
                  Prescription required
                </div>
                <p className="mb-3 text-sm text-red-600">Upload a valid prescription before placing the order.</p>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-white p-3 transition hover:bg-red-50">
                  <UploadCloud size={20} className="mr-2 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    {prescriptionFile ? prescriptionFile.name : "Select prescription"}
                  </span>
                  <input type="file" className="hidden" onChange={(event) => setPrescriptionFile(event.target.files[0])} accept="image/*,.pdf" />
                </label>
                {prescriptionFile ? (
                  <button
                    onClick={handleVerifyPrescription}
                    disabled={isVerifyingPrescription}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-70"
                  >
                    {isVerifyingPrescription ? <Loader2 className="animate-spin" size={16} /> : null}
                    Verify with AI
                  </button>
                ) : null}
              </div>
            ) : null}

            {requiresPrescription && prescriptionVerified ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
                  <ShieldCheck size={20} className="text-sky-600" />
                  <span className="text-sm font-bold">Prescription verified by AI</span>
                </div>
                {parsedMedicines.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Medicines detected</p>
                    <ul className="space-y-1">
                      {parsedMedicines.map((medicine, index) => (
                        <li key={index} className="text-sm text-slate-700">
                          {medicine.name} <span className="text-slate-500">{medicine.dosage}, {medicine.frequency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {matchedProducts.length > 0 ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      {matchedProducts.length} product(s) matched
                    </p>
                    <ul className="space-y-1">
                      {matchedProducts.map((product) => (
                        <li key={product._id} className="text-sm font-medium text-emerald-800">
                          {product.name} - {formatCurrency(product.price)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-500">Payment method</p>
              <div className="mt-3 grid gap-3">
                {paymentChoices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => setPaymentMethod(choice.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      paymentMethod === choice.value
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{choice.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{choice.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Amount payable</h2>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery fee</span>
                  <span className="font-medium text-emerald-600">Free</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(getCartTotal())}</span>
              </div>
              <button
                onClick={handlePayment}
                disabled={isProcessing || !session?.user || (requiresPrescription && !prescriptionVerified)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-sky-700 disabled:opacity-70"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={22} /> : paymentMethod === "COD" ? <BadgeIndianRupee size={22} /> : <CreditCard size={22} />}
                {isProcessing
                  ? "Processing..."
                  : paymentMethod === "COD"
                    ? "Place COD Order"
                    : `Pay ${formatCurrency(getCartTotal())}`}
              </button>
            </div>

            <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="text-sky-400" size={30} />
                <h2 className="text-lg font-bold">
                  {paymentMethod === "COD" ? "Cash on Delivery flow" : "Secure Razorpay flow"}
                </h2>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                {paymentMethod === "COD"
                  ? "COD skips the online gateway. The backend stores the order with paymentStatus set to Pending (COD), notifies admin, and sends the customer confirmation webhook immediately."
                  : "Online payment creates a Razorpay order, verifies the signature on the server, and reduces stock only after successful verification."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
