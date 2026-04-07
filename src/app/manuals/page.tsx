import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import ManualsClient from "./ManualsClient";

interface ManualRow {
  id: number;
  category: string;
  title: string;
  content: string;
}

export default async function ManualsPage() {
  initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const manuals = query<ManualRow>("SELECT * FROM manuals ORDER BY category, title");

  return <ManualsClient session={session} manuals={manuals} />;
}
