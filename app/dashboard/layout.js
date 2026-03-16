import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PatientSidebar } from "@/components/dashboard/PatientSidebar";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin/dashboard");
  }

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
