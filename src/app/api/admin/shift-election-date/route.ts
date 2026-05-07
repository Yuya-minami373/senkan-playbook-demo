import { NextResponse } from "next/server";
import { initDb, query, queryOne, execute } from "@/lib/db";

interface Election {
  id: number;
  name: string;
  election_date: string;
}

function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function diffDays(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

export async function POST(request: Request) {
  await initDb();

  let body: { newDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newDate = body.newDate;
  if (!isValidDate(newDate)) {
    return NextResponse.json(
      { error: "newDate は YYYY-MM-DD 形式で指定してください" },
      { status: 400 }
    );
  }

  const election = await queryOne<Election>(
    "SELECT id, name, election_date FROM elections ORDER BY id LIMIT 1"
  );
  if (!election) {
    return NextResponse.json({ error: "elections レコードが存在しません" }, { status: 500 });
  }

  const delta = diffDays(election.election_date, newDate);

  if (delta === 0) {
    return NextResponse.json({
      ok: true,
      delta: 0,
      message: "日付が同じため変更はありません",
      oldDate: election.election_date,
      newDate,
    });
  }

  const sign = delta >= 0 ? "+" : "";
  const modifier = `${sign}${delta} days`;

  await execute(
    `UPDATE tasks
       SET start_date = CASE WHEN start_date IS NOT NULL THEN date(start_date, ?) END,
           due_date   = CASE WHEN due_date   IS NOT NULL THEN date(due_date,   ?) END`,
    [modifier, modifier]
  );

  await execute(
    `UPDATE tasks
       SET status = '未着手',
           completed_at = NULL,
           started_at = NULL`
  );

  await execute(`UPDATE kians SET status = '未着手'`);

  await execute(
    `UPDATE crew_locations
       SET open_date  = date(open_date,  ?),
           close_date = date(close_date, ?)`,
    [modifier, modifier]
  );

  await execute(
    `UPDATE hourly_reports SET report_date = date(report_date, ?)`,
    [modifier]
  );

  await execute(
    `UPDATE daily_reports SET report_date = date(report_date, ?)`,
    [modifier]
  );

  await execute(
    `UPDATE elections
       SET election_date = ?,
           announcement_date = CASE
             WHEN announcement_date IS NOT NULL THEN date(announcement_date, ?)
             ELSE date(?, '-7 days')
           END
       WHERE id = ?`,
    [newDate, modifier, newDate, election.id]
  );

  const taskCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM tasks"))[0]?.c ?? 0;
  const crewCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM crew_locations"))[0]?.c ?? 0;
  const hourlyCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM hourly_reports"))[0]?.c ?? 0;
  const dailyCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM daily_reports"))[0]?.c ?? 0;

  return NextResponse.json({
    ok: true,
    delta,
    oldDate: election.election_date,
    newDate,
    affected: {
      tasks: taskCount,
      crewLocations: crewCount,
      hourlyReports: hourlyCount,
      dailyReports: dailyCount,
    },
  });
}

export async function GET() {
  await initDb();
  const election = await queryOne<Election>(
    "SELECT id, name, election_date FROM elections ORDER BY id LIMIT 1"
  );
  const taskCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM tasks"))[0]?.c ?? 0;
  const crewCount = (await query<{ c: number }>("SELECT COUNT(*) as c FROM crew_locations"))[0]?.c ?? 0;
  return NextResponse.json({ election, counts: { tasks: taskCount, crewLocations: crewCount } });
}
