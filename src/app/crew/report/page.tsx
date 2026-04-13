import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { initDb, query } from "@/lib/db";
import ReportFormClient from "./ReportFormClient";

interface Location {
  id: number;
  name: string;
  short_name: string;
  open_time: string;
  close_time: string;
}

export default async function CrewReportPage() {
  await initDb();
  const session = await getSession();

  // Allow access for crew_lead and unipoll (demo mode)
  if (!session) redirect("/login");
  if (session.role !== "crew_lead" && session.role !== "unipoll") redirect("/crew");

  const locations = await query<Location>(
    "SELECT id, name, short_name, open_time, close_time FROM crew_locations ORDER BY id"
  );

  return <ReportFormClient session={session} locations={locations} demoMode={session.role === "unipoll"} />;
}
