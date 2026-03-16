import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminDashboardExperience } from "@/components/admin/AdminDashboardExperience";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboardExperience adminName={session.user.name} />;
}
