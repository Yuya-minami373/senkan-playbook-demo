import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { initDb } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !["未着手", "起案済", "決裁済"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await execute("UPDATE kians SET status = ? WHERE id = ?", [status, id]);

  const updated = await queryOne<{ id: number; status: string }>(
    "SELECT id, status FROM kians WHERE id = ?",
    [id]
  );

  return NextResponse.json(updated);
}
