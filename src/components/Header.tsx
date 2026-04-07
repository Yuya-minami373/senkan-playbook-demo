"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  role: "staff" | "manager";
}

export default function Header({ userName, role }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">UniGuide</span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {role === "staff" ? (
            <>
              <Link href="/dashboard" className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition">
                ダッシュボード
              </Link>
              <Link href="/manuals" className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition">
                マニュアル
              </Link>
            </>
          ) : (
            <>
              <Link href="/manager" className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition">
                ガントチャート
              </Link>
              <Link href="/manager/categories" className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition">
                業務別進捗
              </Link>
              <Link href="/manuals" className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition">
                マニュアル
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden md:block">{userName}</span>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
