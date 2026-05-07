import { NextResponse } from "next/server";
import { initDb, queryOne } from "@/lib/db";

interface ElectionRow {
  id: number;
  name: string;
  election_date: string;
  announcement_date: string | null;
}

export const dynamic = "force-dynamic";

export async function GET() {
  await initDb();
  const row = await queryOne<ElectionRow>(
    "SELECT id, name, election_date, announcement_date FROM elections ORDER BY id LIMIT 1"
  );
  if (!row) {
    return NextResponse.json({ election: null });
  }
  return NextResponse.json({
    election: {
      id: Number(row.id),
      name: String(row.name),
      election_date: String(row.election_date),
      announcement_date: row.announcement_date
        ? String(row.announcement_date)
        : null,
    },
  });
}
