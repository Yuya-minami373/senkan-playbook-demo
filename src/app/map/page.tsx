import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import MapClient from "./MapClient";

interface PollingStation {
  id: number;
  no: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voting_area: string | null;
  accessibility: string | null;
  type: "polling" | "poster" | "early";
}

export default async function MapPage() {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const stations = await query<PollingStation>(
    "SELECT * FROM map_points ORDER BY type, no",
    []
  );

  return <MapClient user={session} stations={stations} />;
}
