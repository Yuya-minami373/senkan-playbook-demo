import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateLogin, createSessionToken } from "@/lib/auth";
import { initDb } from "@/lib/db";

export async function POST(request: Request) {
  initDb();
  const { name, password } = await request.json();

  const user = await validateLogin(name, password);
  if (!user) {
    return NextResponse.json({ error: "氏名またはパスワードが正しくありません" }, { status: 401 });
  }

  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ role: user.role, name: user.name });
}
