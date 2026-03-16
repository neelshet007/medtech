import { auth } from "@/lib/auth";
import { getPatientProfile } from "@/lib/dashboard-data";
import { formatCurrency, formatShortDate } from "@/lib/formatters";

export async function ProfileOverview() {
  const session = await auth();
  const { user, orders, latestReport } = await getPatientProfile(session.user.id);

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Profile</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Patient details</h1>
        <p className="mt-2 text-sm text-slate-500">
          This page stays inside the shared dashboard layout so the sidebar and page context remain stable.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Account summary</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Full name</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{user?.name || session.user.name}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{user?.email || session.user.email}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{user?.phone || "Not added"}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Last health upload</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {latestReport ? formatShortDate(latestReport.reportDate) : "No reports"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Recent purchase summary</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm text-slate-500">Spent across recent orders</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 p-4">
              <p className="text-sm text-slate-500">Recent orders reviewed</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{orders.length}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
