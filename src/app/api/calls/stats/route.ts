import { NextResponse } from "next/server";
import { initDb, query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface CategoryCount {
  name: string;
  count: number;
}

interface TotalCount {
  total: number;
}

interface RecentLog {
  id: number;
  category_name: string;
  sub_category: string | null;
  duration: string;
  recorded_by_name: string;
  recorded_at: string;
}

interface TodayCount {
  today_total: number;
}

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "manager" && session.role !== "unipoll") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalRow = await queryOne<TotalCount>("SELECT COUNT(*) as total FROM call_logs");
  const total = totalRow?.total ?? 0;

  const todayRow = await queryOne<TodayCount>(
    "SELECT COUNT(*) as today_total FROM call_logs WHERE date(recorded_at) = date('now', 'localtime')"
  );
  const todayTotal = todayRow?.today_total ?? 0;

  const byCategory = await query<CategoryCount>(`
    SELECT c.name, COUNT(l.id) as count
    FROM call_categories c
    LEFT JOIN call_logs l ON l.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);

  const recent = await query<RecentLog>(`
    SELECT l.id, c.name as category_name, l.sub_category, l.duration, u.name as recorded_by_name, l.recorded_at
    FROM call_logs l
    LEFT JOIN call_categories c ON l.category_id = c.id
    LEFT JOIN users u ON l.recorded_by = u.id
    ORDER BY l.recorded_at ASC
    LIMIT 10
  `);

  return NextResponse.json({ total, todayTotal, byCategory, recent });
}
