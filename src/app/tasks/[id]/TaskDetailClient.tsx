"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  started_at: string | null;
  completed_at: string | null;
  assignee_name: string;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

interface Manual {
  id: number;
  category: string;
  title: string;
  content: string;
}

interface NextTask {
  id: number;
  title: string;
  category: string;
  due_date: string;
}

interface Props {
  task: Task;
  user: User;
  manual: Manual | null;
  nextTask: NextTask | null;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-slate-800 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(
      /^- \[ \] (.+)$/gm,
      '<div class="flex items-center gap-2 py-1"><input type="checkbox" class="w-4 h-4 rounded" /><span class="text-slate-700 text-sm">$1</span></div>'
    )
    .replace(
      /^- \[x\] (.+)$/gm,
      '<div class="flex items-center gap-2 py-1"><input type="checkbox" checked class="w-4 h-4 rounded" /><span class="text-slate-500 text-sm line-through">$1</span></div>'
    )
    .replace(
      /^- (.+)$/gm,
      '<li class="text-slate-700 text-sm py-0.5 flex items-start gap-1.5"><span class="text-orange-400 mt-1 flex-shrink-0">•</span><span>$1</span></li>'
    )
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
      const isHeader = cells.every((c) => c.trim().match(/^[-\s]+$/));
      if (isHeader)
        return (
          "<tr class=\"border-b border-slate-200\">" +
          cells.map((c) => `<td class="px-3 py-1.5 text-xs text-slate-400">${c.trim()}</td>`).join("") +
          "</tr>"
        );
      return (
        "<tr class=\"border-b border-slate-100 hover:bg-slate-50\">" +
        cells.map((c, i) => `<td class="${i === 0 ? "font-medium text-slate-800" : "text-slate-600"} px-3 py-2 text-sm">${c.trim()}</td>`).join("") +
        "</tr>"
      );
    })
    .replace(
      /(<tr.*<\/tr>\n?)+/g,
      (match) => `<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden">${match}</table></div>`
    )
    .replace(/^---$/gm, '<hr class="border-slate-200 my-4">')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-slate-700 text-sm leading-relaxed mb-2">$1</p>');
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const statusOptions = ["未着手", "進行中", "確認待ち"];

const STATUS_CONFIG = {
  "未着手": { dot: "bg-gray-400", btn: "bg-gray-100 text-gray-600 border-gray-200", active: "bg-gray-600 text-white border-gray-600" },
  "進行中": { dot: "bg-blue-500", btn: "bg-white text-blue-600 border-blue-200", active: "bg-blue-600 text-white border-blue-600" },
  "確認待ち": { dot: "bg-yellow-500", btn: "bg-white text-yellow-700 border-yellow-200", active: "bg-yellow-500 text-white border-yellow-500" },
  "完了": { dot: "bg-emerald-500", btn: "bg-white text-emerald-700 border-emerald-200", active: "bg-emerald-600 text-white border-emerald-600" },
} as const;

const SEVERITY_STYLE = {
  critical: { label: "要確認", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "🔴" },
  warning: { label: "注意", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "🟡" },
  caution: { label: "参考", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: "⚪" },
};

type SeverityKey = keyof typeof SEVERITY_STYLE;

interface PitfallItem {
  text: string;
  severity: SeverityKey;
}

interface CriteriaItem {
  q: string;
  a: string;
}

function parsePitfalls(raw: string): PitfallItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { text: item, severity: "warning" as SeverityKey };
        if (item && typeof item === "object" && "text" in item) {
          return { text: item.text, severity: (item.severity ?? "warning") as SeverityKey };
        }
        return { text: String(item), severity: "warning" as SeverityKey };
      });
    }
  } catch { /* ignore */ }
  return [];
}

function parseCriteria(raw: string): CriteriaItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { q: item, a: "" };
        if (item && typeof item === "object" && "q" in item) return item as CriteriaItem;
        return { q: String(item), a: "" };
      });
    }
  } catch { /* ignore */ }
  return [];
}

export default function TaskDetailClient({ task, user, manual, nextTask }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [memo, setMemo] = useState(task.memo || "");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState<string | null>(null);
  const [savingEffort, setSavingEffort] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const conditions: string[] = JSON.parse(task.playbook_conditions || "[]");

  const storageKey = `task-${task.id}-conditions`;
  const [checkedConditions, setCheckedConditions] = useState<boolean[]>(() => {
    if (typeof window === "undefined") return conditions.map(() => false);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: boolean[] = JSON.parse(saved);
        // 条件数が変わった場合は長さを合わせる
        return conditions.map((_, i) => parsed[i] ?? false);
      }
    } catch { /* ignore */ }
    return conditions.map(() => false);
  });

  function toggleCondition(i: number) {
    setCheckedConditions(prev => {
      const next = prev.map((v, idx) => idx === i ? !v : v);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const checkedCount = checkedConditions.filter(Boolean).length;
  const allChecked = conditions.length > 0 && checkedCount === conditions.length;
  const criteria = parseCriteria(task.playbook_criteria);
  const pitfalls = parsePitfalls(task.playbook_pitfalls);

  const hasPlaybook =
    conditions.length > 0 || criteria.length > 0 || pitfalls.length > 0 || !!task.playbook_tip;

  async function updateStatus(newStatus: string) {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  }

  async function handleComplete() {
    setCompleting(true);
    await updateStatus("完了");
    setCompleting(false);
    setShowCompleteModal(true);
  }

  async function handleEffortSave() {
    setSavingEffort(true);
    if (selectedEffort) {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effort_label: selectedEffort }),
      });
    }
    setSavingEffort(false);
    setShowCompleteModal(false);
    router.push(user.role === "manager" ? "/manager" : "/dashboard");
  }

  function handleModalClose() {
    setShowCompleteModal(false);
    router.push(user.role === "manager" ? "/manager" : "/dashboard");
  }

  async function saveMemo() {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const currentStatus = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG["未着手"];

  return (
    <AppShell user={user}>

      {/* ━━━ 完了ポップアップ（工数記録） ━━━ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 w-[400px] flex flex-col gap-5">
            {/* ヘッダー */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold text-emerald-600">完了</p>
              </div>
              <p className="text-base font-bold text-gray-800 leading-snug">「{task.title}」</p>
            </div>

            {/* 工数選択 */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">このタスクにかかった時間は？</p>
              <div className="grid grid-cols-2 gap-2">
                {["30分以内", "1〜2時間", "半日（3〜4時間）", "1日以上"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedEffort(opt)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selectedEffort === opt
                        ? "bg-[#1a3a8f] text-white border-[#1a3a8f]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-[#1a3a8f]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 次のタスク */}
            {nextTask && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-[11px] text-blue-500 font-semibold mb-1">次のタスク</p>
                <Link
                  href={`/tasks/${nextTask.id}`}
                  onClick={() => setShowCompleteModal(false)}
                  className="text-sm font-bold text-[#1a3a8f] hover:underline leading-snug"
                >
                  {nextTask.title} →
                </Link>
                {nextTask.due_date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">期限: {nextTask.due_date}</p>
                )}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-2">
              <button
                onClick={handleModalClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
              >
                スキップ
              </button>
              <button
                onClick={handleEffortSave}
                disabled={!selectedEffort || savingEffort}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#1a3a8f] text-white hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {savingEffort ? "記録中..." : "記録して完了"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* ── Left: Task info panel ── */}
        <div className="w-[300px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <Link
              href={user.role === "manager" ? "/manager" : "/dashboard"}
              className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs mb-3 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </Link>
            <h2 className="text-sm font-bold text-gray-800 leading-snug">{task.title}</h2>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {/* Meta info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{task.category}</span>
              </div>
              {task.due_date && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>期限: {formatDate(task.due_date)}</span>
                </div>
              )}
              {task.started_at && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>着手: {formatDate(task.started_at)}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>完了: {formatDate(task.completed_at)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{task.assignee_name}</span>
              </div>
            </div>

            {/* Status selector */}
            <div>
              <p className="text-[11px] text-gray-400 font-medium mb-2">ステータス変更</p>
              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map((s) => {
                  const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                  const isActive = status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      disabled={saving}
                      className={`px-2 py-2.5 rounded-lg text-xs font-semibold border transition ${
                        isActive ? cfg.active : cfg.btn + " hover:opacity-80"
                      }`}
                      style={{ minHeight: 44 }}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Complete button */}
            {status !== "完了" ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold py-4 rounded-2xl text-base transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                {completing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    完了処理中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    このタスクを完了にする
                  </>
                )}
              </button>
            ) : (
              <div className="w-full bg-emerald-50 border-2 border-emerald-300 text-emerald-700 font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                完了済み
              </div>
            )}
          </div>
        </div>

        {/* ── Right: UniGuide panel ── */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundColor: "#eff6ff" }}>
          <div className="px-8 py-6">
            {/* UniGuide header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
              <div className="w-10 h-10 bg-[#1a3a8f] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-lg">📖</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">UniGuide</p>
                <p className="text-sm font-bold text-blue-900 leading-snug">{task.title}</p>
              </div>
            </div>

            {hasPlaybook ? (
              <div className="space-y-5">

                {/* 1. チェックポイント（最初に目に入る） */}
                {pitfalls.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">⚠️</div>
                      <h4 className="text-sm font-bold text-gray-700">チェックポイント</h4>
                      <span className="text-xs text-gray-400 ml-1">— やってしまいがちな失敗</span>
                    </div>
                    <div className="space-y-2">
                      {pitfalls.map((p, i) => {
                        const sev = SEVERITY_STYLE[p.severity] ?? SEVERITY_STYLE.warning;
                        return (
                          <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${sev.bg} ${sev.border}`}>
                            <span className="text-base shrink-0 mt-0.5">{sev.icon}</span>
                            <div className="flex-1">
                              <span className={`text-[15px] font-bold ${sev.text}`}>{sev.label}</span>
                              <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{p.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 2. 着手条件チェック */}
                {conditions.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${allChecked ? "bg-emerald-100" : "bg-orange-100"}`}>
                        {allChecked ? "✅" : "🔑"}
                      </div>
                      <h4 className="text-sm font-bold text-gray-700">着手条件</h4>
                      <span className="text-xs text-gray-400 ml-1">— 着手前に必ず確認</span>
                      <span className={`text-xs font-semibold ml-auto px-2 py-0.5 rounded-full ${
                        allChecked
                          ? "bg-emerald-100 text-emerald-700"
                          : checkedCount > 0
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {checkedCount}/{conditions.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {conditions.map((c, i) => {
                        const checked = checkedConditions[i] ?? false;
                        return (
                          <button
                            key={i}
                            onClick={() => toggleCondition(i)}
                            className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              checked
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-orange-50/50 border-orange-100 hover:bg-orange-50"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                              checked
                                ? "bg-emerald-500 border-2 border-emerald-500"
                                : "border-2 border-orange-200"
                            }`}>
                              {checked && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm transition-colors ${checked ? "text-emerald-700 line-through" : "text-gray-700"}`}>
                              {c}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {allChecked && (
                      <p className="text-xs text-emerald-600 font-medium mt-2 text-center">
                        ✓ すべての着手条件を確認しました
                      </p>
                    )}
                  </section>
                )}

                {/* 3. 判断ガイド */}
                {criteria.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs">⚖️</div>
                      <h4 className="text-sm font-bold text-gray-700">判断ガイド</h4>
                      <span className="text-xs text-gray-400 ml-1">— 迷ったときの判断基準</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {criteria.map((c, i) => (
                        <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                          <p className="text-sm font-bold text-[#1a3a8f] mb-1.5">Q. {c.q}</p>
                          {c.a && <p className="text-sm text-gray-600 leading-relaxed">→ {c.a}</p>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. ひとことポイント（締め） */}
                {task.playbook_tip && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💡</span>
                      <span className="font-semibold text-blue-900 text-sm">ひとことポイント</span>
                    </div>
                    <p className="text-blue-900 text-sm leading-relaxed">
                      &ldquo;{task.playbook_tip}&rdquo;
                    </p>
                  </div>
                )}

                {/* Manual inline accordion */}
                {manual ? (
                  <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setManualOpen(v => !v)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-blue-50 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#1a3a8f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-700">内部マニュアル</span>
                          <span className="text-xs text-[#1a3a8f] ml-2">{manual.title}</span>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-blue-400 transition-transform ${manualOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {manualOpen && (
                      <div className="border-t border-blue-100 px-5 py-4">
                        <div
                          className="space-y-1"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(manual.content) }}
                        />
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <Link
                            href="/manuals"
                            className="text-xs text-[#1a3a8f] hover:underline font-medium"
                          >
                            マニュアル一覧を見る →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/manuals"
                    className="flex items-center justify-between w-full bg-white hover:bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#1a3a8f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">内部マニュアルを見る</span>
                    </div>
                    <span className="text-[#1a3a8f] text-sm font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <span className="text-4xl mb-4 block">📖</span>
                <p className="text-sm">このタスクの進行ガイドはまだ登録されていません</p>
                <Link
                  href="/manuals"
                  className="inline-flex items-center gap-1 mt-4 text-[#1a3a8f] text-xs font-medium hover:underline"
                >
                  マニュアル一覧を見る →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
