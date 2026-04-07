"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      if (data.role === "manager" || data.role === "unipoll") {
        router.push("/manager");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(data.error || "ログインに失敗しました");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #020817 0%, #050e24 40%, #010a1a 100%)",
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans JP', sans-serif",
      }}
    >
      {/* ── background decoration ── */}

      {/* Orb top-left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Orb bottom-right */}
      <div
        className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Big watermark text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none whitespace-nowrap"
        style={{
          fontSize: "clamp(80px, 20vw, 260px)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.04)",
          lineHeight: 1,
        }}
      >
        UniGuide
      </div>

      {/* ── main card ── */}
      <div className="relative z-10 w-full max-w-[880px] mx-4 flex rounded-3xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >

        {/* Left panel */}
        <div
          className="hidden lg:flex lg:w-[46%] flex-col justify-between p-10 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0d1f3c 0%, #0a1628 100%)" }}
        >
          {/* inner glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, rgba(59,130,246,0.15) 0%, transparent 70%)",
            }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5">
              <div className="bg-white rounded-xl px-3 py-2">
                <Image src="/logo.png" alt="UniPoll" width={140} height={36} className="h-7 w-auto" />
              </div>
            </div>
          </div>

          {/* Center copy */}
          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-blue-400/80 font-semibold mb-3">
                Election Task Management
              </p>
              <h1 className="text-white font-extrabold tracking-tight leading-none mb-4" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>
                UniGuide
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                選挙業務のすべてのタスクに、<br />
                判断基準とチェックポイントを。
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-blue-500/30 via-slate-500/20 to-transparent" />

            {/* Feature list */}
            <ul className="space-y-4">
              {[
                { label: "チェックポイント", desc: "ミスを未然に防ぐ", color: "bg-blue-500" },
                { label: "着手条件・判断基準", desc: "タスクに紐づいて常に参照可能", color: "bg-indigo-500" },
                { label: "リアルタイム進捗", desc: "係長が全体を一目で把握", color: "bg-violet-500" },
              ].map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${f.color}`} />
                  <div>
                    <p className="text-slate-200 text-sm font-semibold leading-tight">{f.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom */}
          <div className="relative z-10">
            <p className="text-slate-700 text-[11px]">© 2026 UniPoll Inc.</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div
          className="flex-1 flex flex-col justify-center p-8 lg:p-12"
          style={{ background: "rgba(10, 16, 30, 0.97)" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex">
            <div className="bg-white rounded-xl px-3 py-2">
              <Image src="/logo.png" alt="UniPoll" width={120} height={32} className="h-6 w-auto" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-white text-2xl font-bold tracking-tight">サインイン</h2>
            <p className="text-slate-500 text-sm mt-1.5">UniGuideへようこそ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                氏名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(59,130,246,0.5)"; e.currentTarget.style.background = "rgba(59,130,246,0.06)"; }}
                onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                placeholder="職員A"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(59,130,246,0.5)"; e.currentTarget.style.background = "rgba(59,130,246,0.06)"; }}
                onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-xl text-sm transition-all duration-200 mt-2 disabled:opacity-50 active:scale-[0.98]"
              style={{
                background: loading
                  ? "rgba(37,99,235,0.5)"
                  : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                color: "#fff",
                boxShadow: loading ? "none" : "0 0 24px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  ログイン中...
                </span>
              ) : "ログイン →"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-400 transition py-2 group"
            >
              <span className="uppercase tracking-wider font-semibold">Demo Accounts</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDemo && (
              <div
                className="mt-2 rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
              >
                {[
                  { role: "担当者（入場整理券）", name: "職員A", pass: "demo", tag: "STAFF" },
                  { role: "担当者（投票所管理）", name: "職員B", pass: "demo", tag: "STAFF" },
                  { role: "係長", name: "係長", pass: "manager", tag: "MGR" },
                  { role: "UniPoll", name: "UniPoll", pass: "unipoll2026", tag: "UNI" },
                ].map((a, i, arr) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => { setName(a.name); setPassword(a.pass); setShowDemo(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-colors hover:bg-white/5 ${i < arr.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", letterSpacing: "0.05em" }}
                      >
                        {a.tag}
                      </span>
                      <span className="text-slate-400">{a.role}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{a.name}</span>
                  </button>
                ))}
                <p className="text-center text-slate-700 text-[10px] py-2">クリックで自動入力</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
