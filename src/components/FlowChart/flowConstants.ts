// デモ用選挙日程。fallback 初期値で、AppShell/Dashboard/Manager が
// /api/elections/current から取得した値で setElectionDates() 経由で上書きする。
// ES modules の live binding により、別モジュールからの import 参照も最新値を読む。
export let ANNOUNCEMENT_DATE = "2026-05-04";
export let VOTE_DATE = "2026-05-11";

export function setElectionDates(
  announcement: string | null | undefined,
  vote: string | null | undefined
) {
  if (announcement) ANNOUNCEMENT_DATE = announcement;
  if (vote) VOTE_DATE = vote;
}

export const CATEGORY_ORDER = [
  "入場整理券",
  "投票所管理",
  "選挙公報",
  "期日前投票",
  "開票",
  "ポスター掲示場",
];

export const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; light: string }> = {
  "入場整理券":     { bg: "bg-blue-500",    border: "border-blue-400",   text: "text-blue-700",   light: "bg-blue-50" },
  "投票所管理":     { bg: "bg-emerald-500",  border: "border-emerald-400", text: "text-emerald-700", light: "bg-emerald-50" },
  "選挙公報":       { bg: "bg-purple-500",   border: "border-purple-400",  text: "text-purple-700",  light: "bg-purple-50" },
  "期日前投票":     { bg: "bg-orange-500",   border: "border-orange-400",  text: "text-orange-700",  light: "bg-orange-50" },
  "開票":           { bg: "bg-red-500",      border: "border-red-400",     text: "text-red-700",     light: "bg-red-50" },
  "ポスター掲示場": { bg: "bg-cyan-500",     border: "border-cyan-400",    text: "text-cyan-700",    light: "bg-cyan-50" },
};

export const STATUS_NODE_COLORS: Record<string, { bg: string; border: string; ring: string }> = {
  "完了":     { bg: "bg-emerald-500", border: "border-emerald-400", ring: "ring-emerald-200" },
  "進行中":   { bg: "bg-blue-500",    border: "border-blue-400",    ring: "ring-blue-200" },
  "確認待ち": { bg: "bg-yellow-500",  border: "border-yellow-400",  ring: "ring-yellow-200" },
  "未着手":   { bg: "bg-gray-300",    border: "border-gray-300",    ring: "ring-gray-100" },
};

export const PHASES = [
  { key: "before", label: "告示前" },
  { key: "announcement", label: "告示日" },
  { key: "campaign", label: "選挙期間" },
  { key: "vote", label: "投票日" },
] as const;

export type PhaseKey = typeof PHASES[number]["key"];

export function getPhase(dueDate: string): PhaseKey {
  if (dueDate < ANNOUNCEMENT_DATE) return "before";
  if (dueDate === ANNOUNCEMENT_DATE) return "announcement";
  if (dueDate < VOTE_DATE) return "campaign";
  return "vote";
}
