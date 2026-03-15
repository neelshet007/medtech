import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function SuccessPage({ searchParams }) {
  // In Next.js 15+, searchParams is an async promise
  const params = await searchParams;
  const orderId = params.order_id || "Unknown";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-100">
        <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 mb-6">Your order has been confirmed successfully and is now being processed.</p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
          <p className="text-sm text-slate-500 mb-1">Order Transaction ID</p>
          <p className="font-mono font-medium text-slate-800 break-all">{orderId}</p>
        </div>

        <Link href="/patient/products" className="block w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
