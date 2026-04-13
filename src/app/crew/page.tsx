import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";
import CrewDashboardClient from "./CrewDashboardClient";

export default async function CrewPage() {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "crew_lead") redirect("/crew/report");

  return <CrewDashboardClient session={session} demoMode={session.role === "unipoll"} />;
}
