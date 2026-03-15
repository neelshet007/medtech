"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Users, Package, ShoppingCart, DollarSign, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Dummy statistics for admin dashboard
  const stats = [
    { label: "Total Users", value: "1,240", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Products", value: "85", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Orders Pending", value: "12", icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Revenue", value: "₹45,230", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Panel</h1>
            <p className="text-slate-500 mt-1">Logged in as {session?.user?.name || "Admin"}</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/products" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col items-start">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Products</h3>
            <p className="text-slate-500 text-sm mb-4">Add, view, and edit medical products across all categories.</p>
            <span className="text-indigo-600 font-medium text-sm mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
              Go to Products <ExternalLink size={16} />
            </span>
          </Link>

          <Link href="/admin/orders" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col items-start">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
              <ShoppingCart size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">View Orders</h3>
            <p className="text-slate-500 text-sm mb-4">Track user transactions, update delivery statuses.</p>
            <span className="text-orange-600 font-medium text-sm mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
              Manage Orders <ExternalLink size={16} />
            </span>
          </Link>
          
          <div className="group bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Users size={120} />
            </div>
            <div className="p-3 bg-slate-800 text-slate-300 rounded-xl mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 relative z-10">User Directory</h3>
            <p className="text-slate-400 text-sm mb-4 relative z-10">Manage patient accounts and review their submitted medical reports seamlessly.</p>
            <span className="text-teal-400 font-medium text-sm mt-auto flex items-center gap-1 relative z-10 hover:text-teal-300 cursor-pointer">
              Coming Soon
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
