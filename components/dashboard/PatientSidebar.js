"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileHeart,
  LogOut,
  PackageSearch,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Activity },
  { href: "/dashboard/health-record", label: "Health Record", icon: FileHeart },
  { href: "/dashboard/orders", label: "Orders", icon: PackageSearch },
  { href: "/dashboard/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-sky-100 bg-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <div className="border-b border-sky-100 px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <FileHeart size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">Patient Portal</p>
            <h1 className="text-xl font-bold text-slate-900">MediConnect</h1>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-4 py-5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/patient/products"
          className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-slate-700 transition hover:border-sky-300 hover:bg-sky-100"
        >
          <p className="font-semibold text-slate-900">Pharmacy Store</p>
          <p className="mt-1 text-xs text-slate-500">Browse products and add medicines to your cart.</p>
        </Link>
      </nav>

      <div className="border-t border-sky-100 p-4">
        <LogoutButton className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
          <LogOut size={16} />
          Sign Out
        </LogoutButton>
      </div>
    </aside>
  );
}
