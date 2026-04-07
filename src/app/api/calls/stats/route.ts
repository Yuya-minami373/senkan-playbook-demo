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

export async function GET() {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "manager" && session.role !== "unipoll") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalRow = queryOne<TotalCount>("SELECT COUNT(*) as total FROM call_logs");
  const total = totalRow?.total ?? 0;

  const byCategory = query<CategoryCount>(`
    SELECT c.name, COUNT(l.id) as count
    FROM call_categories c
    LEFT JOIN call_logs l ON l.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);

  return NextResponse.json({ total, byCategory });
}
