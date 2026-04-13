import Link from "next/link";
import { STATUS_NODE_COLORS } from "./flowConstants";

interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string;
  category: string;
}

function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Small node for overview swimlane
export function FlowNodeSm({ task, onClick }: { task: Task; onClick?: () => void }) {
  const colors = STATUS_NODE_COLORS[task.status] ?? STATUS_NODE_COLORS["未着手"];

  return (
    <button
      onClick={onClick}
      title={`${task.title}\n期限: ${formatMMDD(task.due_date)}\nステータス: ${task.status}`}
      className={`w-7 h-7 rounded-full ${colors.bg} border-2 border-white shadow-sm shrink-0 transition-transform hover:scale-125 hover:ring-2 ${colors.ring} cursor-pointer`}
    />
  );
}

// Medium node for category detail flow
export function FlowNodeMd({ task }: { task: Task }) {
  const colors = STATUS_NODE_COLORS[task.status] ?? STATUS_NODE_COLORS["未着手"];
  const statusConfig: Record<string, { label: string; className: string }> = {
    "未着手":   { label: "未着手",   className: "bg-gray-100 text-gray-600 border-gray-200" },
    "進行中":   { label: "進行中",   className: "bg-blue-50 text-blue-700 border-blue-200" },
    "確認待ち": { label: "確認待ち", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    "完了":     { label: "完了",     className: "bg-green-50 text-green-700 border-green-200" },
  };
  const badge = statusConfig[task.status] ?? statusConfig["未着手"];

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`block w-36 bg-white rounded-xl border ${colors.border} border-l-4 px-3 py-2.5 shrink-0 transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 mb-1.5">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 tabular-nums">~{formatMMDD(task.due_date)}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge.className}`}>
          {badge.label}
        </span>
      </div>
    </Link>
  );
}
