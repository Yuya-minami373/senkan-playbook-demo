import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import CategoriesClient from "./CategoriesClient";

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
}

export default async function CategoriesPage() {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager") redirect("/dashboard");

  const tasks = await query<TaskRow>(`
    SELECT t.id, t.title, t.category, t.status, t.due_date, t.assignee_id, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    ORDER BY t.due_date ASC
  `);

  return <CategoriesClient session={session} tasks={tasks} />;
}
