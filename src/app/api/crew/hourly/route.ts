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
      "SELECT * FROM hourly_reports WHERE crew_location_id = ? AND report_date = ? ORDER BY time_slot",
      [locationId, date]
    );
    return NextResponse.json(reports);
  }

  if (date) {
    const reports = await query(
      "SELECT * FROM hourly_reports WHERE report_date = ? ORDER BY crew_location_id, time_slot",
      [date]
    );
    return NextResponse.json(reports);
  }

  return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session || session.role !== "crew_lead") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { crew_location_id, report_date, time_slot, voter_count, congestion_status, operation_status, note, note_tag } = body;

  if (!crew_location_id || !report_date || !time_slot || voter_count === undefined || !congestion_status || !operation_status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await execute(
    `INSERT OR REPLACE INTO hourly_reports (crew_location_id, report_date, time_slot, voter_count, congestion_status, operation_status, note, note_tag, reported_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [crew_location_id, report_date, time_slot, voter_count, congestion_status, operation_status, note || null, note_tag || null, session.id]
  );

  return NextResponse.json({ ok: true });
}
