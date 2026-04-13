"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Location {
  id: number;
  name: string;
  short_name: string;
  open_time: string;
  close_time: string;
}

interface HourlyReport {
  time_slot: string;
  voter_count: number;
  congestion_status: string;
  operation_status: string;
}

interface Props {
  session: User;
  locations: Location[];
  demoMode?: boolean;
}

const CONGESTION_OPTIONS = [
  { value: "空いている", label: "空いている", color: "bg-green-500", ring: "ring-green-200", bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  { value: "やや混雑", label: "やや混雑", color: "bg-yellow-500", ring: "ring-yellow-200", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
  { value: "混雑", label: "混雑", color: "bg-red-500", ring: "ring-red-200", bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
];

const OPERATION_OPTIONS = [
  { value: "異常なし", label: "異常なし", color: "bg-green-500", ring: "ring-green-200", bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  { value: "対応事案あり", label: "対応事案あり", color: "bg-yellow-500", ring: "ring-yellow-200", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
  { value: "解決済", label: "解決済", color: "bg-blue-500", ring: "ring-blue-200", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
];

function generateTimeSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let h = openH;
  let m = openM;

  while (h < closeH || (h === closeH && m < closeM)) {
    const startStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    let endH = h + 1;
    let endM = m;
    if (endH > closeH || (endH === closeH && endM > closeM)) {
      endH = closeH;
      endM = closeM;
    }
    const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    slots.push(`${startStr}-${endStr}`);
    h = endH;
    m = endM;
  }
  return slots;
}

function getCurrentTimeSlot(slots: string[]): string {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of slots) {
    const [start, end] = slot.split("-");
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    if (currentMinutes >= sH * 60 + sM && currentMinutes < eH * 60 + eM) {
      return slot;
    }
  }
  // Default to the last slot or first
  return slots[slots.length - 1] || slots[0];
}

export default function ReportFormClient({ session, locations, demoMode = false }: Props) {
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id ?? 0);
  const [date] = useState("2026-07-06"); // Demo date
  const [timeSlot, setTimeSlot] = useState("");
  const [voterCount, setVoterCount] = useState("");
  const [congestion, setCongestion] = useState("空いている");
  const [operation, setOperation] = useState("異常なし");
  const [note, setNote] = useState("");
  const [noteTag, setNoteTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reportedSlots, setReportedSlots] = useState<string[]>([]);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const timeSlots = selectedLocation ? generateTimeSlots(selectedLocation.open_time, selectedLocation.close_time) : [];

  // Initialize time slot
  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlot) {
      setTimeSlot(getCurrentTimeSlot(timeSlots));
    }
  }, [timeSlots, timeSlot]);

  // Fetch reported slots
  useEffect(() => {
    if (selectedLocationId && date) {
      fetch(`/api/crew/hourly?location_id=${selectedLocationId}&date=${date}`)
        .then(r => r.json())
        .then((data: HourlyReport[]) => {
          setReportedSlots(data.map((d: HourlyReport) => d.time_slot));
        });
    }
  }, [selectedLocationId, date]);

  async function handleSubmit() {
    if (!voterCount || isNaN(Number(voterCount))) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/crew/hourly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crew_location_id: selectedLocationId,
          report_date: date,
          time_slot: timeSlot,
          voter_count: Number(voterCount),
          congestion_status: congestion,
          operation_status: operation,
          note: note || null,
          note_tag: noteTag,
        }),
      });

      if (res.ok) {
        setToast("報告を送信しました");
        setReportedSlots(prev => [...new Set([...prev, timeSlot])]);
        // Reset for next slot
        setVoterCount("");
        setNote("");
        setNoteTag(null);
        setCongestion("空いている");
        setOperation("異常なし");
        // Move to next unreported slot
        const currentIdx = timeSlots.indexOf(timeSlot);
        const nextSlot = timeSlots.slice(currentIdx + 1).find(s => !reportedSlots.includes(s));
        if (nextSlot) setTimeSlot(nextSlot);

        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell user={session} demoMode={demoMode}>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 bg-white border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">時間帯報告</h1>
          <p className="text-xs text-gray-500 mt-0.5">投票所の状況を1時間ごとに報告してください</p>
        </div>

        <div className="px-6 py-5 space-y-5 max-w-lg mx-auto">
          {/* Location selector */}
          {locations.length > 1 && (
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">投票所</label>
              <select
                value={selectedLocationId}
                onChange={e => { setSelectedLocationId(Number(e.target.value)); setTimeSlot(""); setReportedSlots([]); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.short_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Time slot selector */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">時間帯</label>
            <div className="grid grid-cols-3 gap-1.5">
              {timeSlots.map(slot => {
                const isReported = reportedSlots.includes(slot);
                const isSelected = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className={`relative px-2 py-2 text-xs rounded-lg border transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold ring-2 ring-blue-100"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {slot}
                    {isReported && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voter count */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">投票者数（この時間帯）</label>
            <input
              type="number"
              inputMode="numeric"
              value={voterCount}
              onChange={e => setVoterCount(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-4 py-3.5 text-2xl font-bold text-gray-900 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Congestion status */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">混雑状況</label>
            <div className="grid grid-cols-3 gap-2">
              {CONGESTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCongestion(opt.value)}
                  className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    congestion === opt.value
                      ? `${opt.bg} ${opt.border} ${opt.text} ring-2 ${opt.ring}`
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operation status */}
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">運営ステータス</label>
            <div className="grid grid-cols-3 gap-2">
              {OPERATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOperation(opt.value)}
                  className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    operation === opt.value
                      ? `${opt.bg} ${opt.border} ${opt.text} ring-2 ${opt.ring}`
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600">特記事項（任意）</label>
              {(operation === "対応事案あり" || operation === "解決済") && (
                <div className="flex gap-1">
                  {["B", "C"].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setNoteTag(noteTag === tag ? null : tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition ${
                        noteTag === tag
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {tag}類
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="対応内容や特筆すべき事項があれば記入してください"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Spacer for sticky button */}
          <div className="h-20" />
        </div>

        {/* Sticky submit button */}
        <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleSubmit}
              disabled={submitting || !voterCount || isNaN(Number(voterCount))}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                submitting || !voterCount || isNaN(Number(voterCount))
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {submitting ? "送信中..." : "報告を送信"}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-lg animate-in">
            {toast}
          </div>
        )}
      </div>
    </AppShell>
  );
}
