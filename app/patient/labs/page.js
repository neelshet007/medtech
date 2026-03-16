"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/formatters";

export default function PatientLabsPage() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ serviceId: "", bookingDate: "", prescriptionUrl: "" });

  async function loadData() {
    setIsLoading(true);
    const [serviceResponse, bookingResponse] = await Promise.all([
      fetch("/api/lab-services", { cache: "no-store" }),
      fetch("/api/lab-bookings", { cache: "no-store" }),
    ]);
    const serviceData = await serviceResponse.json();
    const bookingData = await bookingResponse.json();
    setServices(serviceData.services || []);
    setBookings(bookingData.bookings || []);
    setIsLoading(false);
  }

  useEffect(() => {
    async function hydrateLabs() {
      await loadData();
    }

    hydrateLabs();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await fetch("/api/lab-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setToast(result.success ? "Lab booked." : result.message || "Booking failed.");
    if (result.success) {
      setForm({ serviceId: "", bookingDate: "", prescriptionUrl: "" });
      await loadData();
    }
  }

  return (
    <div className="relative">
      {toast ? <div className="fixed right-6 top-6 z-50 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div> : null}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><FlaskConical size={22} /></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Lab booking</h1>
              <p className="text-sm text-slate-500">
                The lab page now follows the same page frame and card language as the pharmacy store and consultation flow.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center rounded-[32px] border border-sky-100 bg-white p-16 shadow-sm">
            <Loader2 className="animate-spin text-sky-600" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Available services</h2>
              <div className="mt-4 space-y-4">
                {services.map((service) => (
                  <article key={service._id} className="rounded-2xl bg-sky-50/60 p-4">
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="text-sm text-slate-500">{service.description}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(service.price)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Book lab test</h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-sky-300 focus:outline-none" required>
                  <option value="">Select service</option>
                  {services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
                </select>
                <input type="date" value={form.bookingDate} onChange={(event) => setForm({ ...form, bookingDate: event.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-sky-300 focus:outline-none" required />
                <input value={form.prescriptionUrl} onChange={(event) => setForm({ ...form, prescriptionUrl: event.target.value })} placeholder="Prescription URL (optional)" className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-sky-300 focus:outline-none" />
                <button className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700">Book lab test</button>
              </form>

              <div className="mt-6 space-y-3">
                {bookings.map((booking) => (
                  <article key={booking._id} className="rounded-2xl bg-sky-50/60 p-4">
                    <p className="font-semibold text-slate-900">{booking.service?.name}</p>
                    <p className="text-sm text-slate-500">{formatShortDate(booking.bookingDate)}</p>
                    <p className="text-xs text-sky-700">{booking.status}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
