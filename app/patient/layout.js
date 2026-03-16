import { PatientSidebar } from "@/components/dashboard/PatientSidebar";

export default function PatientLayout({ children }) {
  return (
    <div className="min-h-screen bg-sky-50/70 text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        <PatientSidebar />
        <div className="flex-1">
          <div className="min-h-screen p-4 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
