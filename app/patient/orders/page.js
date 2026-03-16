import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Order } from "@/models/Order";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
      case "Pending":
        return <Clock className="text-slate-500" size={24} />;
      case "Processing":
        return <Package className="text-blue-500" size={24} />;
      case "Shipped":
        return <Truck className="text-orange-500" size={24} />;
      case "Delivered":
        return <Truck className="text-teal-500" size={24} />;
      case "Completed":
        return <CheckCircle className="text-emerald-500" size={24} />;
      default:
        return <Clock className="text-slate-500" size={24} />;
    }
  };

  return (
    <div className="p-6 md:p-8 xl:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Order History</h1>
        <p className="mt-1 text-slate-500">Track your active shipments and view past orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <Package size={64} className="mb-4 text-slate-300" />
          <h2 className="mb-2 text-xl font-bold text-slate-700">No orders found</h2>
          <p className="mb-6 text-slate-500">When you buy medicines, your orders will appear here.</p>
          <Link href="/patient/products" className="rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition hover:bg-teal-700">
            Browse Pharmacy
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id.toString()} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</p>
                  <p className="text-sm font-medium text-slate-900">{order._id.toString()}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Date</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Total Amount</p>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div className="text-right sm:text-left">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.paymentStatus === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <Package size={20} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="line-clamp-1 text-sm font-bold text-slate-900">{item.product?.name || "Unknown Product"}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Delivery Tracking</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.orderStatus)}
                      <span className="font-bold text-slate-800">{order.orderStatus}</span>
                    </div>
                  </div>

                  {order.trackingId ? (
                    <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                      <span className="font-medium text-slate-500">Tracking ID: </span>
                      <span className="font-mono font-bold text-slate-900">{order.trackingId}</span>
                    </div>
                  ) : null}

                  <div className="relative mt-2 space-y-4 border-l-2 border-slate-200 pl-4">
                    {order.deliveryTimeline?.length > 0 ? (
                      order.deliveryTimeline.map((step, index) => (
                        <div key={index} className="relative">
                          <div
                            className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${
                              index === order.deliveryTimeline.length - 1 ? "bg-teal-500 ring-4 ring-teal-100" : "bg-slate-300"
                            }`}
                          />
                          <p className="text-sm font-bold text-slate-900">{step.status}</p>
                          <p className="mb-1 text-xs text-slate-500">{formatDateTime(step.date)}</p>
                          {step.description ? <p className="text-xs text-slate-600">{step.description}</p> : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm italic text-slate-500">No tracking updates yet.</p>
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
