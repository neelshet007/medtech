"use client";

import { useEffect, useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function PatientConsultPage() {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ doctorId: "", timeSlot: "" });

  async function loadData() {
    setIsLoading(true);
    const [doctorResponse, appointmentResponse] = await Promise.all([
      fetch("/api/doctors", { cache: "no-store" }),
      fetch("/api/appointments", { cache: "no-store" }),
    ]);
    const doctorData = await doctorResponse.json();
    const appointmentData = await appointmentResponse.json();
    setDoctors(doctorData.doctors || []);
    setAppointments(appointmentData.appointments || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to book appointment.");
      }
      setToast("Appointment booked.");
      setForm({ doctorId: "", timeSlot: "" });
      await loadData();
    } catch (error) {
      setToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {toast ? <div className="fixed right-6 top-6 z-50 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div> : null}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><Stethoscope size={22} /></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Doctor consultation</h1>
              <p className="text-sm text-slate-500">
                The consult page now uses the same patient shell, spacing rhythm, card shapes, and light medical palette as the pharmacy and lab flows.
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
              <h2 className="text-xl font-bold text-slate-900">Available doctors</h2>
              <div className="mt-4 space-y-4">
                {doctors.map((doctor) => (
                  <article key={doctor._id} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                    <p className="font-semibold text-slate-900">{doctor.name}</p>
                    <p className="text-sm text-slate-500">{doctor.specialization}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(doctor.consultationFee)}</p>
                    <p className="mt-2 text-xs text-slate-500">{doctor.availableTimings.join(", ")}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Book appointment</h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <select
                  value={form.doctorId}
                  onChange={(event) => setForm({ ...form, doctorId: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-sky-300 focus:outline-none"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name} - {doctor.specialization}</option>)}
                </select>
                <input
                  value={form.timeSlot}
                  onChange={(event) => setForm({ ...form, timeSlot: event.target.value })}
                  placeholder="Choose a slot, e.g. Mon 10:00 AM"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-sky-300 focus:outline-none"
                  required
                />
                <button disabled={isSubmitting} className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700">
                  {isSubmitting ? "Booking..." : "Book appointment"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {appointments.map((appointment) => (
                  <article key={appointment._id} className="rounded-2xl bg-sky-50/60 p-4">
                    <p className="font-semibold text-slate-900">{appointment.doctor?.name}</p>
                    <p className="text-sm text-slate-500">{appointment.timeSlot}</p>
                    <p className="text-xs text-sky-700">{appointment.status}</p>
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
