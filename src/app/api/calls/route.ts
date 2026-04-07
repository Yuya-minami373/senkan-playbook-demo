import { NextRequest, NextResponse } from "next/server";
import { initDb, query, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface CallCategory {
  id: number;
  name: string;
  manual: string | null;
  sort_order: number;
}

export async function GET() {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = query<CallCategory>(
    "SELECT id, name, manual, sort_order FROM call_categories ORDER BY sort_order ASC"
  );

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { category_id: number; sub_category?: string; duration: string };
  const { category_id, sub_category, duration } = body;

  if (!category_id || !duration) {
    return NextResponse.json({ error: "category_id and duration are required" }, { status: 400 });
  }

  execute(
    "INSERT INTO call_logs (category_id, sub_category, duration, recorded_by) VALUES (?, ?, ?, ?)",
    [category_id, sub_category ?? null, duration, session.id]
  );

  return NextResponse.json({ ok: true });
}
