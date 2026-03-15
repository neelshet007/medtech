import Link from "next/link";
import { auth } from "@/lib/auth";
import PatientDashboard from "@/app/patient/page";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Please Sign In</h1>
          <p className="mt-3 text-slate-500">You must authenticate before accessing the patient dashboard.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700">
              Patient Login
            </Link>
            <Link href="/admin/login" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PatientDashboard />;
}
