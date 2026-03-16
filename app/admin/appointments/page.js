"use client";

import { useEffect, useState } from "react";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function loadAppointments() {
      const response = await fetch("/api/appointments", { cache: "no-store" });
      const result = await response.json();
      setAppointments(result.appointments || []);
    }

    loadAppointments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <div className="mt-4 space-y-3">
          {appointments.map((appointment) => (
            <article key={appointment._id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{appointment.user?.name} with {appointment.doctor?.name}</p>
              <p className="text-sm text-slate-500">{appointment.timeSlot}</p>
              <p className="text-xs text-sky-700">{appointment.status}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
