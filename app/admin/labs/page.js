"use client";

import { useEffect, useState } from "react";

const initialForm = { name: "", description: "", price: "" };

export default function AdminLabsPage() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(initialForm);

  async function loadData() {
    const [serviceResponse, bookingResponse] = await Promise.all([
      fetch("/api/lab-services", { cache: "no-store" }),
      fetch("/api/lab-bookings", { cache: "no-store" }),
    ]);
    const serviceResult = await serviceResponse.json();
    const bookingResult = await bookingResponse.json();
    setServices(serviceResult.services || []);
    setBookings(bookingResult.bookings || []);
  }

  useEffect(() => {
    async function hydrateLabs() {
      await loadData();
    }

    hydrateLabs();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await fetch("/api/lab-services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    setForm(initialForm);
    loadData();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Manage lab services</h1>
          <div className="mt-4 space-y-3">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Service name" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="w-full rounded-xl border border-slate-200 px-4 py-3" rows="4" required />
            <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Price" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            <button className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white">Save service</button>
          </div>
        </form>

        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Lab services and bookings</h2>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <article key={service._id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{service.name}</p>
                <p className="text-sm text-slate-500">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {bookings.map((booking) => (
              <article key={booking._id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{booking.user?.name} booked {booking.service?.name}</p>
                <p className="text-xs text-sky-700">{booking.status}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
