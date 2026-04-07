import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = queryOne<TaskRow>(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `, [id]);

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, memo, effort_label } = body;

  if (status) {
    const now = new Date().toISOString().split("T")[0];
    execute(
      `UPDATE tasks SET
        status = ?,
        started_at   = CASE WHEN ? = '進行中' AND started_at IS NULL THEN ? ELSE started_at END,
        completed_at = CASE WHEN ? = '完了'   THEN ? ELSE completed_at END
       WHERE id = ?`,
      [status, status, now, status, now, id]
    );
  }
  if (memo !== undefined) {
    execute("UPDATE tasks SET memo = ? WHERE id = ?", [memo, id]);
  }
  if (effort_label !== undefined) {
    execute("UPDATE tasks SET effort_label = ? WHERE id = ?", [effort_label, id]);
  }

  const updated = queryOne<TaskRow>(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `, [id]);

  return NextResponse.json(updated);
}
