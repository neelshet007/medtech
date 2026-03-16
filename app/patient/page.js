"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Bell,
  ChevronRight,
  UploadCloud,
  Loader2,
} from "lucide-react";

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHealthData() {
      try {
        const res = await fetch("/api/health-records/analyze");
        const data = await res.json();
        
        if (data.success && data.reports.length > 0) {
           const formatted = data.reports.slice(0, 7).reverse().map((report) => {
             const d = new Date(report.reportDate);
             return {
                day: `${d.getDate()}/${d.getMonth()+1}`,
                sugar: report.metrics?.sugarLevel || 0,
                pressure: report.metrics?.bloodPressureSys || 0,
                weight: report.metrics?.weight || 0,
             }
           });
           setChartData(formatted);
           setLatestMetrics(data.reports[0].metrics);
        } else {
           // Fallback to sample data if no reports
           setChartData([
            { day: "Mon", sugar: 110, pressure: 120 },
            { day: "Tue", sugar: 105, pressure: 118 },
            { day: "Wed", sugar: 108, pressure: 122 },
            { day: "Thu", sugar: 98, pressure: 115 },
            { day: "Fri", sugar: 102, pressure: 119 },
           ]);
        }
      } catch(error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHealthData();
  }, []);


  async function handleFileUpload(event) {
    if (!event.target.files?.[0]) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", event.target.files[0]);

    try {
      const res = await fetch("/api/health-records/analyze", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
         alert("Report successfully parsed and stored in your medical vault.");
         window.location.reload(); // Refresh to catch new metric
      } else {
         alert(data.message || "Failed to parse report.");
      }
    } catch(err) {
       alert("Error uploading report.");
    } finally {
       setIsUploading(false);
    }
  }

  return (
    <main className="p-6 md:p-8 xl:p-12">
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
            {isLoading ? (
               <div className="w-full h-full flex justify-center items-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Line type="monotone" dataKey="sugar" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Blood Sugar (mg/dL)" />
                  <Line type="monotone" dataKey="pressure" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Systolic BP (mmHg)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {latestMetrics && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex gap-6 text-sm">
              <div><span className="text-slate-500 block">Heart Rate</span><span className="font-bold text-slate-800 text-lg">{latestMetrics.heartRate} bpm</span></div>
              <div><span className="text-slate-500 block">Weight</span><span className="font-bold text-slate-800 text-lg">{latestMetrics.weight || "--"} kg</span></div>
              <div><span className="text-slate-500 block">Blood Group</span><span className="font-bold text-lg text-rose-500">{latestMetrics.bloodGroup || "--"}</span></div>
            </div>
          )}
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
  );
}

