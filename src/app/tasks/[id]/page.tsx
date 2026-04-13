import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryOne, query } from "@/lib/db";
import { initDb } from "@/lib/db";
import TaskDetailClient from "./TaskDetailClient";

interface NextTaskRow {
  id: number;
  title: string;
  category: string;
  due_date: string;
}

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  started_at: string | null;
  completed_at: string | null;
  assignee_id: number;
  assignee_name: string;
  sub_assignee_id: number | null;
  sub_assignee_name: string | null;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

interface ManualRow {
  id: number;
  category: string;
  title: string;
  content: string;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const task = await queryOne<TaskRow>(`
    SELECT t.*, u.name as assignee_name, u2.name as sub_assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users u2 ON t.sub_assignee_id = u2.id
    WHERE t.id = ?
  `, [id]);

  if (!task) notFound();

  const manual = await queryOne<ManualRow>(
    `SELECT * FROM manuals WHERE category = ? LIMIT 1`,
    [task.category]
  ) ?? null;

  const nextTask = await queryOne<NextTaskRow>(`
    SELECT t.id, t.title, t.category, t.due_date
    FROM tasks t
    WHERE t.category = ?
      AND t.id != ?
      AND t.status != '完了'
      AND t.assignee_id = ?
    ORDER BY t.due_date ASC
    LIMIT 1
  `, [task.category, task.id, task.assignee_id]) ?? null;

  const kians = await query<{ id: number; title: string; due_timing: string | null; status: string; note: string | null }>(
    `SELECT id, title, due_timing, status, note FROM kians WHERE task_id = ?`,
    [task.id]
  );

  return <TaskDetailClient task={task} user={session} manual={manual} nextTask={nextTask} kians={kians} />;
}
