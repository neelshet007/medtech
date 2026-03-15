"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Package, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed": case "Delivered":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg"><CheckCircle2 size={12}/> {status}</span>;
      case "Processing": case "Pending":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-lg"><Clock size={12}/> {status}</span>;
      case "Failed": case "Cancelled":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg"><XCircle size={12}/> {status}</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg"><Package size={12}/> {status}</span>;
    }
  };

  if (session?.user?.role !== "admin") return <div className="p-8">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
            <p className="text-slate-500 text-sm mt-1">Review customer transactions and fulfillments.</p>
          </div>
          <button onClick={fetchOrders} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium text-sm">
                    <th className="p-4">Order ID & Date</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Items</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-mono text-xs text-slate-500 mb-1">{order._id.substring(order._id.length - 8).toUpperCase()}</div>
                        <div className="text-sm font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{order.user?.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500">{order.user?.email || "N/A"}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-700">
                          {order.items.length} items
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[150px]">
                          {order.items.map(i => i.product?.name).join(', ')}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-900">₹{order.totalAmount}</td>
                      <td className="p-4">{getStatusBadge(order.paymentStatus)}</td>
                      <td className="p-4">{getStatusBadge(order.orderStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
