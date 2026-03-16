"use client";

import { useEffect, useState } from "react";

const initialForm = { name: "", specialization: "", consultationFee: "", availableTimings: "" };

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);

  async function loadDoctors() {
    const response = await fetch("/api/doctors", { cache: "no-store" });
    const result = await response.json();
    setDoctors(result.doctors || []);
  }

  useEffect(() => {
    async function hydrateDoctors() {
      await loadDoctors();
    }

    hydrateDoctors();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        consultationFee: Number(form.consultationFee),
        availableTimings: form.availableTimings.split("\n").map((item) => item.trim()).filter(Boolean),
      }),
    });
    setForm(initialForm);
    loadDoctors();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Manage doctors</h1>
          <div className="mt-4 space-y-3">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Doctor name" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            <input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="Specialization" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            <input value={form.consultationFee} onChange={(event) => setForm({ ...form, consultationFee: event.target.value })} placeholder="Consultation fee" className="w-full rounded-xl border border-slate-200 px-4 py-3" required />
            <textarea value={form.availableTimings} onChange={(event) => setForm({ ...form, availableTimings: event.target.value })} placeholder="One slot per line" className="w-full rounded-xl border border-slate-200 px-4 py-3" rows="5" />
            <button className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white">Save doctor</button>
          </div>
        </form>

        <section className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Doctors</h2>
          <div className="mt-4 space-y-3">
            {doctors.map((doctor) => (
              <article key={doctor._id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{doctor.name}</p>
                <p className="text-sm text-slate-500">{doctor.specialization}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
