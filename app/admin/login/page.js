"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HeartPulse, Loader2, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await signIn("admin-credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    setIsLoading(false);

    if (response?.error) {
      setError(response.error);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40">
        <div className="mb-8 flex items-center gap-3 text-teal-400">
          <HeartPulse size={34} />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Restricted</p>
            <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal-900/60 bg-teal-950/50 p-4 text-sm text-teal-100">
          <Shield size={18} className="mt-0.5 shrink-0" />
          <p>Only manually provisioned administrators from the isolated admin collection can sign in here.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Admin Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-500"
              placeholder="admin@company.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-teal-500"
              placeholder="Enter your admin password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Access Admin Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
