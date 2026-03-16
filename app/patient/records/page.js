import { redirect } from "next/navigation";

export default function PatientRecordsRedirect() {
  redirect("/dashboard/health-record");
}
