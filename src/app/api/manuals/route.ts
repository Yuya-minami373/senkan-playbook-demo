import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";

interface ManualRow {
  id: number;
  category: string;
  title: string;
  content: string;
}

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const manuals = await query<ManualRow>("SELECT * FROM manuals ORDER BY category, title");
  return NextResponse.json(manuals);
}
