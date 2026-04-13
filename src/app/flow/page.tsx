import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query, initDb } from "@/lib/db";
import FlowPageClient from "./FlowPageClient";

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
}

export default async function FlowPage() {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const tasks = await query<TaskRow>(
    "SELECT id, title, category, status, due_date FROM tasks ORDER BY due_date ASC, id ASC"
  );

  return <FlowPageClient session={session} tasks={tasks} demoMode={session.role === "unipoll"} />;
}
