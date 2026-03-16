"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Loader2, LogOut, Package, RefreshCw, XCircle, Truck, Save, ExternalLink } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { formatCurrency } from "@/lib/formatters";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateData, setUpdateData] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [toast, setToast] = useState("");

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
        
        // Initialize update data forms
        const initials = {};
        data.orders.forEach(o => {
          initials[o._id] = {
            orderStatus: o.orderStatus || "Pending",
            trackingId: o.trackingId || "",
            description: ""
          };
        });
        setUpdateData(initials);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  function handleDataChange(orderId, field, value) {
    setUpdateData((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  }

  async function updateOrderStatus(orderId) {
    const data = updateData[orderId];
    if (!data || !data.orderStatus) return;

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: data.orderStatus,
          trackingId: data.trackingId,
          description: data.description || `Admin Update: ${data.orderStatus}`
        })
      });
      const result = await res.json();
      if (result.success) {
        setToast("Order updated successfully.");
        fetchOrders();
      } else {
        setToast(result.message || "Failed to update order");
      }
    } catch (error) {
       console.error(error);
       setToast("Error updating order.");
    } finally {
       setUpdatingId(null);
    }
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function getStatusBadge(status) {
    if (!status) return null;
    switch (status) {
      case "Completed":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg w-fit"><CheckCircle2 size={12} /> {status}</span>;
      case "Processing":
      case "Pending":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-lg w-fit"><Clock size={12} /> {status}</span>;
      case "Failed":
      case "Cancelled":
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg w-fit"><XCircle size={12} /> {status}</span>;
      case "Shipped":
         return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-teal-100 text-teal-700 rounded-lg w-fit"><Truck size={12} /> {status}</span>;
      case "Delivered":
         return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-sky-100 text-sky-700 rounded-lg w-fit"><Truck size={12} /> {status}</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg w-fit"><Package size={12} /> {status}</span>;
    }
  }

  // Group by customer
  const groupedOrders = orders.reduce((acc, order) => {
    const customerId = order.user?._id || "unknown";
    if (!acc[customerId]) {
      acc[customerId] = {
        customerName: order.user?.name || "Unknown",
        customerEmail: order.user?.email || "N/A",
        orders: []
      };
    }
    acc[customerId].orders.push(order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <div className="mb-3">
              <Link href="/admin/dashboard" className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50">
                <ArrowLeft size={18} />
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Delivery & Order Management</h1>
            <p className="text-slate-500 text-sm mt-1">Review customer transactions and update delivery tracking details.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchOrders} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition">
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
            <LogoutButton className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
              <LogOut size={16} />
              Log Out
            </LogoutButton>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl flex justify-center border border-slate-100 shadow-sm"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
        ) : Object.keys(groupedOrders).length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-100 shadow-sm">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedOrders).map(([customerId, data]) => (
               <div key={customerId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                 <div 
                   className="bg-slate-50 p-6 flex justify-between items-center cursor-pointer hover:bg-teal-50 transition border-b border-slate-100"
                   onClick={() => setExpandedCustomer(expandedCustomer === customerId ? null : customerId)}
                 >
                   <div>
                     <h2 className="text-lg font-bold text-slate-900">{data.customerName}</h2>
                     <p className="text-sm text-slate-500">{data.customerEmail} • {data.orders.length} order(s)</p>
                   </div>
                   <div className="text-teal-600 font-bold text-sm">
                     {expandedCustomer === customerId ? "Hide Orders" : "View Orders"}
                   </div>
                 </div>

                 {expandedCustomer === customerId && (
                   <div className="p-6 space-y-8">
                     {data.orders.map((order) => (
                       <div key={order._id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                         <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono font-bold text-slate-500">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                              <span className="text-sm font-medium text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                               {getStatusBadge(order.paymentStatus)}
                               {getStatusBadge(order.orderStatus)}
                            </div>
                         </div>
                         <div className="p-4 flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Items Ordered</h3>
                               <ul className="space-y-2 mb-4">
                                  {order.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-sm">
                                      <span className="text-slate-700">{item.quantity}x {item.product?.name}</span>
                                      <span className="text-slate-900 font-medium">Rs. {item.price}</span>
                                    </li>
                                  ))}
                               </ul>
                               <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                  <span className="text-sm font-bold text-slate-500">Total</span>
                                  <span className="font-bold text-teal-600 text-lg">{formatCurrency(order.totalAmount)}</span>
                               </div>
                               {order.prescriptionUrl && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-700">Prescription Attached</span>
                                    {order.prescriptionUrl !== "verified_by_ai" ? (
                                      <Link href={order.prescriptionUrl} target="_blank" className="text-xs font-bold text-red-600 flex items-center gap-1 hover:underline"><ExternalLink size={14}/> View</Link>
                                    ) : (
                                      <span className="text-xs font-bold text-emerald-600">AI Verified ✅</span>
                                    )}
                                  </div>
                               )}
                            </div>
                            
                            <div className="w-full lg:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Update Tracking details</h3>
                               {updateData[order._id] && (
                                 <div className="space-y-3">
                                   <div>
                                      <label className="text-xs font-bold text-slate-600">Status</label>
                                      <select 
                                        className="w-full mt-1 p-2 text-sm border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        value={updateData[order._id].orderStatus}
                                        onChange={(e) => handleDataChange(order._id, "orderStatus", e.target.value)}
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                      </select>
                                   </div>
                                   <div>
                                      <label className="text-xs font-bold text-slate-600">Tracking ID</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. BLUEDART12345" 
                                        className="w-full mt-1 p-2 text-sm border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        value={updateData[order._id].trackingId}
                                        onChange={(e) => handleDataChange(order._id, "trackingId", e.target.value)}
                                      />
                                   </div>
                                   <div>
                                      <label className="text-xs font-bold text-slate-600">Update Message (Optional)</label>
                                      <input 
                                        type="text" 
                                        placeholder="e.g. Package arrived at local hub" 
                                        className="w-full mt-1 p-2 text-sm border border-slate-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                        value={updateData[order._id].description}
                                        onChange={(e) => handleDataChange(order._id, "description", e.target.value)}
                                      />
                                   </div>
                                   <button 
                                     onClick={() => updateOrderStatus(order._id)}
                                     disabled={updatingId === order._id}
                                     className="w-full mt-2 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition disabled:opacity-70 flex justify-center items-center gap-2"
                                   >
                                     {updatingId === order._id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                     Save & Update App
                                   </button>
                                 </div>
                               )}
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
