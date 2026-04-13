import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { initDb, query, execute } from "@/lib/db";

export async function GET(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const date = searchParams.get("date");

  if (locationId && date) {
    const reports = await query(
      "SELECT * FROM daily_reports WHERE crew_location_id = ? AND report_date = ? LIMIT 1",
      [locationId, date]
    );
    return NextResponse.json(reports[0] || null);
  }

  if (date) {
    const reports = await query(
      `SELECT dr.*, cl.name as location_name, cl.short_name
       FROM daily_reports dr
       JOIN crew_locations cl ON dr.crew_location_id = cl.id
       WHERE dr.report_date = ?
       ORDER BY cl.id`,
      [date]
    );
    return NextResponse.json(reports);
  }

  return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session || session.role !== "unipoll") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { crew_location_id, report_date, total_voters, summary, handover } = body;

  if (!crew_location_id || !report_date || total_voters === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await execute(
    `INSERT OR REPLACE INTO daily_reports (crew_location_id, report_date, total_voters, summary, handover, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [crew_location_id, report_date, total_voters, summary || null, handover || null, session.id]
  );

  return NextResponse.json({ ok: true });
}
