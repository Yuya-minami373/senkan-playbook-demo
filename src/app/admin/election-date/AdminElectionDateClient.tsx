"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Election {
  id: number;
  name: string;
  election_date: string;
}

interface Props {
  election: Election | null;
  taskCount: number;
  crewCount: number;
}

function formatDateJa(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${iso}（${w}）`;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDays(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

export default function AdminElectionDateClient({
  election,
  taskCount,
  crewCount,
}: Props) {
  const router = useRouter();
  const today = todayIso();

  const initialNew = election?.election_date ?? today;
  const [newDate, setNewDate] = useState(initialNew);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentDate = election?.election_date ?? "";
  const delta = useMemo(
    () => (currentDate ? diffDays(currentDate, newDate) : 0),
    [currentDate, newDate]
  );
  const daysFromToday = useMemo(
    () => diffDays(today, newDate),
    [today, newDate]
  );

  async function handleApply() {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/shift-election-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "更新に失敗しました");
      } else {
        setResult(
          `✅ 選挙期日を ${data.newDate} に更新しました（${data.delta >= 0 ? "+" : ""}${data.delta}日シフト）。完了タスクは「未着手」に戻しました。`
        );
        setShowConfirm(false);
        router.refresh();
      }
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <p className="text-red-600">elections レコードが存在しません。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">操作者専用ページ</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            🛠 選挙期日の調整
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            商談前にデモ全体の日付を任意の選挙期日に揃えられます。完了タスクは「未着手」に戻り、新しい選挙としてリセットされます。
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
            現在の選挙期日
          </p>
          <p className="text-lg font-semibold text-gray-900">{election.name}</p>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {formatDateJa(election.election_date)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            今日（{today}）から{" "}
            <span
              className={
                diffDays(today, election.election_date) < 0
                  ? "text-red-600 font-semibold"
                  : "text-gray-700 font-semibold"
              }
            >
              {diffDays(today, election.election_date)}日
            </span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              新しい選挙期日を選択
            </span>
            <input
              type="date"
              value={newDate}
              min={today}
              onChange={(e) => setNewDate(e.target.value)}
              className="mt-2 block w-full md:w-72 px-3 py-2 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">今日からの日数</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {daysFromToday >= 0 ? `+${daysFromToday}` : daysFromToday}日後
              </p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-500">現在期日からの差分</p>
              <p
                className={`text-lg font-bold mt-1 ${
                  delta === 0
                    ? "text-gray-400"
                    : delta > 0
                    ? "text-green-700"
                    : "text-orange-700"
                }`}
              >
                {delta >= 0 ? "+" : ""}
                {delta}日
              </p>
            </div>
          </div>

          <button
            disabled={delta === 0 || submitting}
            onClick={() => setShowConfirm(true)}
            className="mt-6 w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            この日付で更新する
          </button>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded p-4 mb-4 text-sm">
            {result}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4 mb-4 text-sm">
            ❌ {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs text-amber-900">
          <p className="font-semibold mb-1">⚠ 更新時の挙動</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              全タスク（{taskCount}件）の <code>start_date / due_date</code> を差分日数だけスライド
            </li>
            <li>全タスクのステータスを「未着手」に戻し、完了日・着手日をクリア</li>
            <li>起案（kians）のステータスも「未着手」にリセット</li>
            <li>
              期日前投票所（{crewCount}件）の運営期間も連動してシフト
            </li>
            <li>クルー時間帯別報告・日次報告も同じ差分日数でシフト</li>
          </ul>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              適用前にご確認ください
            </h2>
            <div className="space-y-2 text-sm text-gray-700 mb-5">
              <p>
                現在: <span className="font-mono">{election.election_date}</span>
              </p>
              <p>
                新規: <span className="font-mono font-semibold">{newDate}</span>
              </p>
              <p>
                差分:{" "}
                <span className="font-bold">
                  {delta >= 0 ? "+" : ""}
                  {delta}日
                </span>
              </p>
              <hr className="my-3" />
              <p className="text-xs text-gray-500">
                タスク {taskCount}件 / 期日前投票所 {crewCount}件 をシフトし、全タスクを「未着手」に戻します。
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? "適用中…" : "実行する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
