import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { initDb } from "@/lib/db";
import CallDetailClient from "./CallDetailClient";

interface CallCategory {
  id: number;
  name: string;
  manual: string | null;
  sort_order: number;
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  initDb();
  const category = queryOne<CallCategory>(
    "SELECT id, name, manual, sort_order FROM call_categories WHERE id = ?",
    [parseInt(id)]
  );

  if (!category) redirect("/calls");

  return <CallDetailClient user={user} category={category} />;
}
