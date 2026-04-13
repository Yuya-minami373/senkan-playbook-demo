import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { initDb, query } from "@/lib/db";

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await query(
    "SELECT id, name, short_name, address, lat, lng, election_id, open_date, close_date, open_time, close_time FROM crew_locations ORDER BY id"
  );

  return NextResponse.json(locations);
}
