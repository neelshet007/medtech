"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { DollarSign, ExternalLink, LogOut, Package, ShoppingCart, Users } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const stats = [
    { label: "Total Users", value: "Protected", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Products", value: "Live DB", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Orders Pending", value: "Tracked", icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Revenue", value: "Verified", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Panel</h1>
            <p className="mt-1 text-slate-500">Authenticated as {session?.user?.name || "Administrator"}</p>
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/products" className="group flex flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-indigo-600 transition group-hover:scale-110">
              <Package size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Manage Medicines</h3>
            <p className="mb-4 text-sm text-slate-500">Create, update, delete, and restock products directly against the product collection.</p>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
              Open Products <ExternalLink size={16} />
            </span>
          </Link>

          <Link href="/admin/orders" className="group flex flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="mb-4 rounded-xl bg-orange-50 p-3 text-orange-600 transition group-hover:scale-110">
              <ShoppingCart size={24} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Review Orders</h3>
            <p className="mb-4 text-sm text-slate-500">Inspect patient purchases and payment verification results through protected admin APIs.</p>
            <span className="mt-auto flex items-center gap-1 text-sm font-medium text-orange-600 transition group-hover:gap-2">
              Open Orders <ExternalLink size={16} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
