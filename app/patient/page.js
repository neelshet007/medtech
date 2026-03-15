"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  Bell,
  ChevronRight,
  FileText,
  HeartPulse,
  LogOut,
  ShoppingBag,
  UploadCloud,
  Video,
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const healthData = [
  { day: "Mon", sugar: 110, pressure: 120 },
  { day: "Tue", sugar: 105, pressure: 118 },
  { day: "Wed", sugar: 108, pressure: 122 },
  { day: "Thu", sugar: 98, pressure: 115 },
  { day: "Fri", sugar: 102, pressure: 119 },
];

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);

  function handleFileUpload(event) {
    if (!event.target.files?.[0]) {
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      alert("Report successfully stored in your medical vault.");
      setIsUploading(false);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex flex-col h-auto md:min-h-screen p-4 sticky top-0 md:h-screen">
        <div className="flex items-center gap-2 text-teal-600 mb-8 pt-2 px-2">
          <HeartPulse size={28} strokeWidth={2} />
          <span className="text-xl font-extrabold tracking-tight">MediConnect</span>
        </div>

        <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 text-teal-700 font-bold">
            <Activity size={18} /> Overview
          </Link>
          <Link href="/patient/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium transition">
            <ShoppingBag size={18} /> Pharmacy Store
          </Link>
          <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Medical</div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 bg-slate-50 font-medium">
            <div className="flex items-center gap-3"><FileText size={18} /> Health Records</div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 bg-slate-50 font-medium">
            <div className="flex items-center gap-3"><Video size={18} /> Consult A Doctor</div>
            <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">NEW</span>
          </div>
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <LogoutButton className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-bold transition">
            <LogOut size={18} /> Sign Out
          </LogoutButton>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 xl:p-12 overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {session?.user?.name?.split(" ")[0] || "Patient"}.</h1>
            <p className="text-slate-500 mt-1">Here is what is happening with your health today.</p>
          </div>
          <Link href="/patient/products" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-slate-800 transition">
            Order Medicines
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vitals Overview</h2>
                <p className="text-sm text-slate-500">Fasting Blood Sugar vs Blood Pressure</p>
              </div>
              <button className="text-teal-600 text-sm font-bold flex items-center hover:text-teal-700">Detailed Report <ChevronRight size={16} /></button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Line type="monotone" dataKey="sugar" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Blood Sugar (mg/dL)" />
                  <Line type="monotone" dataKey="pressure" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Systolic BP (mmHg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-500 to-emerald-400 p-6 rounded-3xl shadow-md text-white">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <UploadCloud size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1">Upload New Report</h3>
              <p className="text-teal-50 text-sm mb-4 leading-relaxed">Securely store your PDFs or images in a protected document flow.</p>
              <label className="bg-white text-teal-700 w-full py-2.5 rounded-xl font-bold text-center block cursor-pointer hover:bg-teal-50 transition shadow-sm">
                {isUploading ? "Encrypting Upload..." : "Select File"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" disabled={isUploading} />
              </label>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Bell size={18} /></div>
                  <h3 className="font-bold text-slate-900">Reminders</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 bg-orange-500 rounded-full shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Paracetamol (500mg)</p>
                      <p className="text-xs text-slate-500">Take 1 pill after dinner today.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0"></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Pending Refill</p>
                      <p className="text-xs text-slate-500">Your Vitamin D3 60K stock is low.</p>
                      <Link href="/patient/products" className="text-xs font-bold text-blue-600 mt-1 inline-block hover:underline">Order Now</Link>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
