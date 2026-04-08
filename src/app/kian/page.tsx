import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import KianClient from "./KianClient";

interface KianRow {
  id: number;
  title: string;
  category: string;
  task_id: number | null;
  task_title: string | null;
  due_timing: string | null;
  status: string;
  note: string | null;
}

export default async function KianPage() {
  initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const kians = query<KianRow>(`
    SELECT k.*, t.title as task_title
    FROM kians k
    LEFT JOIN tasks t ON k.task_id = t.id
    ORDER BY k.category, k.id
  `, []);

  return <KianClient user={session} kians={kians} />;
}
