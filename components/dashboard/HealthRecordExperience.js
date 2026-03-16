"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Droplet,
  FileText,
  HeartPulse,
  Loader2,
  Scale,
  UploadCloud,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate } from "@/lib/formatters";

const tabs = ["Overview", "Reports", "Trends", "History"];

function SummaryCard({ item }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };

  const icons = {
    "Heart Rate": HeartPulse,
    "Blood Pressure": Activity,
    Weight: Scale,
    Sugar: Droplet,
  };

  const Icon = icons[item.label] || FileText;

  return (
    <article className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[item.tone] || tones.sky}`}>
          <Icon size={20} />
        </div>
      </div>
    </article>
  );
}

export function HealthRecordExperience() {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadRecords() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/health-records/analyze", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load health records.");
      }

      setData(result);
    } catch (loadError) {
      setError(loadError.message || "Unable to load health records.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const trendData = useMemo(
    () =>
      (data?.reports || [])
        .slice()
        .reverse()
        .map((report) => ({
          date: formatShortDate(report.reportDate),
          sugar: report.metrics?.sugarLevel || 0,
          pressure: report.metrics?.bloodPressureSys || 0,
          weight: report.metrics?.weight || 0,
        })),
    [data]
  );

  const distributionData = useMemo(() => {
    const reports = data?.reports || [];
    const latest = reports[0]?.metrics || {};
    return [
      { name: "Heart", value: latest.heartRate || 0, fill: "#0284c7" },
      { name: "Sugar", value: latest.sugarLevel || 0, fill: "#06b6d4" },
      { name: "Weight", value: latest.weight || 0, fill: "#10b981" },
    ].filter((entry) => entry.value > 0);
  }, [data]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/health-records/analyze", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload failed.");
      }

      setToast("Health record uploaded successfully.");
      await loadRecords();
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Health Record</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Medical history and trends</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              The page is now structured as a light clinical workspace: summary cards first, tabbed navigation for
              context, then visual trends and report history so records feel organized instead of visually fragmented.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {isUploading ? "Uploading..." : "Upload Report"}
            <input type="file" accept=".pdf,image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.summaryCards || []).map((item) => (
          <SummaryCard key={item.label} item={item} />
        ))}
      </section>

      <section className="rounded-[32px] border border-sky-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                tab === item ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-[32px] border border-sky-100 bg-white p-16 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 size={30} className="animate-spin text-sky-600" />
            <p className="text-sm font-medium">Loading health records from the database...</p>
          </div>
        </section>
      ) : error ? (
        <section className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 text-rose-600" size={20} />
            <div>
              <h2 className="text-lg font-bold text-rose-700">Unable to load records</h2>
              <p className="mt-1 text-sm text-rose-600">{error}</p>
              <button
                onClick={loadRecords}
                className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      ) : (data?.reports || []).length === 0 ? (
        <section className="rounded-[32px] border border-dashed border-sky-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex max-w-lg flex-col items-center">
            <div className="rounded-full bg-sky-100 p-5 text-sky-700">
              <FileText size={28} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">No health records uploaded yet</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              The empty state is explicit so patients are not shown fake sample values. Upload a report to generate
              summary cards, trends, and history from real stored records.
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {tab === "Overview" ? "Vitals trend overview" : `${tab} view`}
                </h2>
                <p className="text-sm text-slate-500">
                  The graph area now has a dedicated container, clearer spacing, and consistent clinical labeling.
                </p>
              </div>
              <Link href="/dashboard/profile" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
                Open profile
              </Link>
            </div>

            <div className="mt-6 rounded-[28px] border border-sky-100 bg-sky-50/70 p-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="#dbeafe" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sugar" name="Sugar" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="pressure" name="Systolic BP" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="weight" name="Weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Latest report mix</h2>
              <p className="mt-1 text-sm text-slate-500">A compact chart highlights the latest measurable values.</p>
              <div className="mt-4 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={4} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Report history</h2>
              <div className="mt-4 space-y-3">
                {data.reports.slice(0, 5).map((report) => (
                  <article key={report._id} className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{report.title}</p>
                        <p className="text-sm text-slate-500">{formatShortDate(report.reportDate)}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700">Stored</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
