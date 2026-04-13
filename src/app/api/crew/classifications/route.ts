import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classifications = await query(
    "SELECT id, category, title, description, sort_order FROM business_classifications ORDER BY category, sort_order"
  );

  return NextResponse.json(classifications);
}
