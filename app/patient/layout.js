import Link from "next/link";
import {
  Activity,
  FileText,
  HeartPulse,
  LogOut,
  ShoppingBag,
  Video,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

export default function PatientLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex flex-col h-auto md:min-h-screen p-4 sticky top-0 md:h-screen">
        <div className="flex items-center gap-2 text-teal-600 mb-8 pt-2 px-2">
          <HeartPulse size={28} strokeWidth={2} />
          <span className="text-xl font-extrabold tracking-tight">MediConnect</span>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-medium transition text-slate-500 group focus-within:bg-teal-50 focus-within:text-teal-700 focus-within:font-bold">
            <Activity size={18} /> Overview
          </Link>
          <Link href="/patient/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition group focus-within:bg-slate-50 focus-within:text-slate-900">
            <ShoppingBag size={18} /> Pharmacy Store
          </Link>
          <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Medical</div>
          <Link href="/dashboard/health-record" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition">
            <div className="flex items-center gap-3"><FileText size={18} /> Health Records</div>
          </Link>
          <Link href="/patient/consult" className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 hover:bg-teal-50 hover:text-teal-700 font-medium transition cursor-pointer">
            <div className="flex items-center gap-3"><Video size={18} /> Consult A Doctor</div>
            <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">NEW</span>
          </Link>
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <LogoutButton className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition">
            <LogOut size={18} /> Sign Out
          </LogoutButton>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
