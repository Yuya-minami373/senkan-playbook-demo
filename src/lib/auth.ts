import { cookies } from "next/headers";
import { queryOne } from "./db";

export interface User {
  id: number;
  name: string;
  role: "staff" | "manager" | "unipoll";
  category: string | null;
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session) return null;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    return data as User;
  } catch {
    return null;
  }
}

export function createSessionToken(user: User): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export async function validateLogin(
  name: string,
  password: string
): Promise<User | null> {
  const user = queryOne<{ id: number; name: string; role: string; category: string | null }>(
    "SELECT id, name, role, category FROM users WHERE name = ? AND password = ?",
    [name, password]
  );

  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    role: user.role as "staff" | "manager" | "unipoll",
    category: user.category,
  };
}
