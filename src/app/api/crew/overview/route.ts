import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

export async function GET(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date parameter is required" }, { status: 400 });
  }

  // Get all locations with their latest hourly report for the given date
  const locations = await query<{
    id: number;
    name: string;
    short_name: string;
    address: string;
    lat: number;
    lng: number;
    open_time: string;
    close_time: string;
  }>(
    "SELECT id, name, short_name, address, lat, lng, open_time, close_time FROM crew_locations ORDER BY id"
  );

  const overview = await Promise.all(locations.map(async (loc) => {
    const latestReport = await query<{
      time_slot: string;
      voter_count: number;
      congestion_status: string;
      operation_status: string;
      note: string | null;
      reported_at: string;
    }>(
      `SELECT time_slot, voter_count, congestion_status, operation_status, note, reported_at
       FROM hourly_reports
       WHERE crew_location_id = ? AND report_date = ?
       ORDER BY time_slot DESC LIMIT 1`,
      [loc.id, date]
    );

    const totalResult = await query<{ total: number }>(
      `SELECT COALESCE(SUM(voter_count), 0) as total
       FROM hourly_reports
       WHERE crew_location_id = ? AND report_date = ?`,
      [loc.id, date]
    );

    const incidents = await query<{
      time_slot: string;
      operation_status: string;
      note: string | null;
    }>(
      `SELECT time_slot, operation_status, note
       FROM hourly_reports
       WHERE crew_location_id = ? AND report_date = ? AND operation_status != '異常なし'
       ORDER BY time_slot DESC`,
      [loc.id, date]
    );

    return {
      ...loc,
      latest_report: latestReport[0] || null,
      total_voters: totalResult[0]?.total ?? 0,
      incidents,
    };
  }));

  return NextResponse.json(overview);
}
