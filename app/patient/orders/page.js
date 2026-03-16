import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getOrders(userId) {
  await connectToDatabase();
  const orders = await Order.find({ user: userId })
    .populate("items.product", "name imageUrl")
    .sort({ createdAt: -1 })
    .lean();
  return orders;
}

export default async function PatientOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const orders = await getOrders(session.user.id);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Processing": return <Package className="text-blue-500" size={24} />;
      case "Shipped": return <Truck className="text-orange-500" size={24} />;
      case "Out for Delivery": return <Truck className="text-teal-500" size={24} />;
      case "Delivered": return <CheckCircle className="text-emerald-500" size={24} />;
      default: return <Clock className="text-slate-500" size={24} />;
    }
  };

  return (
    <div className="p-6 md:p-8 xl:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Order History</h1>
        <p className="text-slate-500 mt-1">Track your active shipments and view past orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Package size={64} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No orders found</h2>
          <p className="text-slate-500 mb-6">When you buy medicines, your orders will appear here.</p>
          <Link href="/patient/products" className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition">
            Browse Pharmacy
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id.toString()} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1">Order ID</p>
                  <p className="text-sm font-mono font-medium text-slate-900">{order._id.toString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1">Date</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1">Total Amount</p>
                  <p className="text-sm font-bold text-slate-900">Rs. {order.totalAmount}</p>
                </div>
                <div className="text-right sm:text-left">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.paymentStatus === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Package size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.product?.name || "Unknown Product"}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity} × Rs. {item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Delivery Tracking</h3>
                    <div className="flex items-center gap-2">
                       {getStatusIcon(order.orderStatus)}
                       <span className="font-bold text-slate-800">{order.orderStatus}</span>
                    </div>
                  </div>

                  {order.trackingId && (
                     <div className="mb-4 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-slate-500 font-medium">Tracking ID: </span>
                        <span className="font-mono font-bold text-slate-900">{order.trackingId}</span>
                     </div>
                  )}

                  <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 mt-2">
                    {order.deliveryTimeline?.length > 0 ? (
                      order.deliveryTimeline.map((step, index) => (
                        <div key={index} className="relative">
                          <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${index === order.deliveryTimeline.length - 1 ? "bg-teal-500 ring-4 ring-teal-100" : "bg-slate-300"}`}></div>
                          <p className="text-sm font-bold text-slate-900">{step.status}</p>
                          <p className="text-xs text-slate-500 mb-1">{new Date(step.date).toLocaleString()}</p>
                          {step.description && <p className="text-xs text-slate-600">{step.description}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No tracking updates yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
