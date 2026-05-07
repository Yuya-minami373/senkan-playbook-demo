import { initDb, query, queryOne } from "@/lib/db";
import AdminElectionDateClient from "./AdminElectionDateClient";

export const dynamic = "force-dynamic";

interface Election {
  id: number;
  name: string;
  election_date: string;
}

export default async function AdminElectionDatePage() {
  await initDb();
  const election = await queryOne<Election>(
    "SELECT id, name, election_date FROM elections ORDER BY id LIMIT 1"
  );
  const taskCount =
    (await query<{ c: number }>("SELECT COUNT(*) as c FROM tasks"))[0]?.c ?? 0;
  const crewCount =
    (await query<{ c: number }>("SELECT COUNT(*) as c FROM crew_locations"))[0]?.c ?? 0;

  const electionPlain = election
    ? {
        id: Number(election.id),
        name: String(election.name),
        election_date: String(election.election_date),
      }
    : null;

  return (
    <AdminElectionDateClient
      election={electionPlain}
      taskCount={Number(taskCount)}
      crewCount={Number(crewCount)}
    />
  );
}
