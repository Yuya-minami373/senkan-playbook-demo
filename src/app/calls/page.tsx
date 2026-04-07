import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CallsClient from "./CallsClient";

export default async function CallsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <CallsClient user={session} />;
}
