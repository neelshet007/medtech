"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ExternalLink,
  Loader2,
  LogOut,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LogoutButton } from "@/components/LogoutButton";
import { formatCurrency, formatNumber, formatShortDate } from "@/lib/formatters";

const categoryColors = ["#0284c7", "#0f766e", "#4f46e5", "#f97316", "#10b981"];

export function AdminDashboardExperience({ adminName }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterView, setFilterView] = useState("day");

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load analytics.");
        }

        setAnalytics(result);
      } catch (loadError) {
        setError(loadError.message || "Failed to load analytics.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const metricCards = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      { label: "Total revenue", value: formatCurrency(analytics.metrics.totalRevenue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Total orders", value: formatNumber(analytics.metrics.totalOrders), icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50" },
      { label: "Pending orders", value: formatNumber(analytics.metrics.pendingOrders), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Customers", value: formatNumber(analytics.metrics.totalCustomers), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
      { label: "Revenue today", value: formatCurrency(analytics.metrics.revenueToday), icon: DollarSign, color: "text-cyan-600", bg: "bg-cyan-50" },
      { label: "Revenue this week", value: formatCurrency(analytics.metrics.revenueThisWeek), icon: DollarSign, color: "text-sky-600", bg: "bg-sky-50" },
      { label: "Revenue this month", value: formatCurrency(analytics.metrics.revenueThisMonth), icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
      { label: "Completed orders", value: formatNumber(analytics.metrics.completedOrders), icon: Package, color: "text-teal-600", bg: "bg-teal-50" },
    ];
  }, [analytics]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin analytics</h1>
            <p className="mt-1 text-slate-500">
              Authenticated as {adminName || "Administrator"}. All revenue cards below are computed from live order data.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50">
              Patient View
            </Link>
            <LogoutButton className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800">
              <LogOut size={16} />
              Log Out
            </LogoutButton>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-100 bg-white p-16 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className={`rounded-xl p-4 ${stat.bg}`}>
                    <stat.icon className={stat.color} size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Revenue by day</h2>
                    <p className="text-sm text-slate-500">
                      Daily revenue uses completed payments grouped by order creation date.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {["day", "customer", "category"].map((view) => (
                      <button
                        key={view}
                        onClick={() => setFilterView(view)}
                        className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                          filterView === view ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {view === "day" ? "Revenue by day" : view === "customer" ? "Revenue by customer" : "Revenue by category"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 h-[320px]">
                  {filterView === "day" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.dailyRevenue}>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : filterView === "category" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.revenueByCategory} dataKey="revenue" nameKey="category" innerRadius={50} outerRadius={94}>
                          {analytics.revenueByCategory.map((entry, index) => (
                            <Cell key={entry.category} fill={categoryColors[index % categoryColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                      {analytics.revenueByCustomer.map((customer) => (
                        <div key={customer.customerId} className="rounded-xl bg-white p-4 shadow-sm">
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          <p className="text-sm text-slate-500">{customer.email}</p>
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-slate-500">{customer.orders} orders</span>
                            <span className="font-bold text-slate-900">{formatCurrency(customer.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Aggregation notes</h2>
                <div className="mt-4 space-y-4 text-sm leading-6 text-slate-500">
                  <p>Revenue totals come from MongoDB aggregations over the `orders` collection using completed payments only.</p>
                  <p>Category sales unwind `items`, then join the related product to group by category and sum line revenue.</p>
                  <p>Customer revenue joins each order with its patient record, groups by customer id, and sums total order value.</p>
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Pending orders list</h2>
                <div className="mt-4 space-y-3">
                  {analytics.pendingOrders.map((order) => (
                    <div key={order._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{order.user?.name || "Unknown customer"}</p>
                          <p className="text-sm text-slate-500">{order.user?.email || "No email"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-sm text-slate-500">{order.orderStatus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Completed orders list</h2>
                <div className="mt-4 space-y-3">
                  {analytics.completedOrders.map((order) => (
                    <div key={order._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{order.user?.name || "Unknown customer"}</p>
                          <p className="text-sm text-slate-500">{formatShortDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-sm text-emerald-600">{order.orderStatus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/products" className="group flex flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-indigo-600 transition group-hover:scale-110">
                  <Package size={24} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">Manage medicines</h3>
                <p className="mb-4 text-sm text-slate-500">Create, update, delete, and restock products from live inventory data.</p>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                  Open Products <ExternalLink size={16} />
                </span>
              </Link>

              <Link href="/admin/orders" className="group flex flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="mb-4 rounded-xl bg-orange-50 p-3 text-orange-600 transition group-hover:scale-110">
                  <ShoppingCart size={24} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">Review orders</h3>
                <p className="mb-4 text-sm text-slate-500">Update statuses, tracking ids, and customer order history in one place.</p>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-orange-600 transition group-hover:gap-2">
                  Open Orders <ExternalLink size={16} />
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
