import Link from "next/link";
import { Activity, BellRing, ClipboardList, PillBottle, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPatientOverview } from "@/lib/dashboard-data";
import { formatDateTime, formatShortDate } from "@/lib/formatters";

const quickActions = [
  { href: "/dashboard/cart", label: "Go to Cart" },
  { href: "/dashboard/orders", label: "View Orders" },
  { href: "/patient/checkout", label: "Upload Prescription" },
  { href: "https://wa.me/", label: "Talk to Customer Care", external: true },
  { href: "/dashboard/health-record", label: "Medicine Reminder Setup" },
];

export async function DashboardOverview() {
  const session = await auth();
  const overview = await getPatientOverview(session.user.id);

  const latestDelivery = overview.activeDelivery;
  const latestReport = overview.latestReport;

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Dashboard Overview</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome, {session.user.name?.split(" ")[0] || "Patient"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              This overview is the landing page after login so patients see orders, delivery progress, cart state,
              and support actions first instead of being redirected into health records.
            </p>
          </div>
          <Link
            href="/patient/products"
            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Order Medicines
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending orders</p>
              <p className="text-2xl font-bold text-slate-900">{overview.counts.pendingOrders}</p>
            </div>
          </div>
        </article>
        <article className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Delivery status</p>
              <p className="text-lg font-bold text-slate-900">{latestDelivery?.orderStatus || "No active delivery"}</p>
            </div>
          </div>
        </article>
        <article className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <PillBottle size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Latest report</p>
              <p className="text-lg font-bold text-slate-900">
                {latestReport ? formatShortDate(latestReport.reportDate) : "No uploads yet"}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed deliveries</p>
              <p className="text-2xl font-bold text-slate-900">{overview.counts.deliveredOrders}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <BellRing size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
              <p className="text-sm text-slate-500">
                These CTAs cover the main patient tasks and keep navigation stable across the dashboard shell.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-100 hover:text-sky-800"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Current delivery</h2>
          {latestDelivery ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Latest order status</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{latestDelivery.orderStatus}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Last updated {formatDateTime(latestDelivery.updatedAt || latestDelivery.createdAt)}
                </p>
              </div>
              <Link
                href="/dashboard/orders"
                className="inline-flex rounded-2xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Open order history
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-6 text-sm text-slate-500">
              No active shipments are in progress. New order updates will appear here.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
