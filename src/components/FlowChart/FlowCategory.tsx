import Link from "next/link";
import { CATEGORY_COLORS, STATUS_NODE_COLORS, ANNOUNCEMENT_DATE, VOTE_DATE } from "./flowConstants";

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

interface Props {
  tasks: Task[];
  category: string;
  onBack: () => void;
}

const STATUS_BADGE: Record<string, { text: string; className: string }> = {
  "未着手":   { text: "未着手",   className: "bg-gray-100 text-gray-500 border-gray-200" },
  "進行中":   { text: "進行中",   className: "bg-blue-50 text-blue-700 border-blue-200" },
  "確認待ち": { text: "確認待ち", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "完了":     { text: "完了",     className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

type MilestoneType = "announcement" | "vote";

interface StepGroup {
  type: "tasks";
  date: string;
  tasks: Task[];
}

interface MilestoneGroup {
  type: "milestone";
  milestone: MilestoneType;
  label: string;
  date: string;
}

type FlowItem = StepGroup | MilestoneGroup;

export default function FlowCategory({ tasks, category, onBack }: Props) {
  const catColor = CATEGORY_COLORS[category];
  const sorted = [...tasks].sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id);
  const completed = sorted.filter(t => t.status === "完了").length;
  const inProgress = sorted.filter(t => t.status === "進行中").length;
  const pct = sorted.length > 0 ? Math.round((completed / sorted.length) * 100) : 0;

  // Group tasks by date and insert milestones
  const dateGroups: StepGroup[] = [];
  for (const task of sorted) {
    const existing = dateGroups.find(g => g.date === task.due_date);
    if (existing) existing.tasks.push(task);
    else dateGroups.push({ type: "tasks", date: task.due_date, tasks: [task] });
  }

  // Insert milestone markers
  const flowItems: FlowItem[] = [];
  let announcementInserted = false;
  let voteInserted = false;

  for (const group of dateGroups) {
    if (!announcementInserted && group.date >= ANNOUNCEMENT_DATE) {
      flowItems.push({ type: "milestone", milestone: "announcement", label: "告示日", date: ANNOUNCEMENT_DATE });
      announcementInserted = true;
    }
    if (!voteInserted && group.date >= VOTE_DATE) {
      flowItems.push({ type: "milestone", milestone: "vote", label: "投票日", date: VOTE_DATE });
      voteInserted = true;
    }
    flowItems.push(group);
  }
  // Insert remaining milestones at end if needed
  if (!announcementInserted) {
    flowItems.push({ type: "milestone", milestone: "announcement", label: "告示日", date: ANNOUNCEMENT_DATE });
  }
  if (!voteInserted) {
    flowItems.push({ type: "milestone", milestone: "vote", label: "投票日", date: VOTE_DATE });
  }

  let stepNumber = 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-3 h-3 rounded-full ${catColor?.bg ?? "bg-gray-400"}`} />
          <h2 className="text-lg font-bold text-gray-900">{category}</h2>
          <span className="text-sm text-gray-400">{sorted.length}タスク</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-gray-700 tabular-nums">{pct}%</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{completed}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{inProgress}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />{sorted.length - completed - inProgress}</span>
          </div>
        </div>
      </div>

      {/* Vertical step flow */}
      <div className="relative ml-6">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

        {flowItems.map((item, itemIdx) => {
          if (item.type === "milestone") {
            const milestoneItem = item as MilestoneGroup;
            const isAnnouncement = milestoneItem.milestone === "announcement";
            return (
              <div key={`milestone-${milestoneItem.milestone}`} className="relative flex items-center py-3">
                {/* Milestone diamond */}
                <div className={`absolute left-4 -translate-x-1/2 w-4 h-4 rotate-45 border-2 ${
                  isAnnouncement ? "border-orange-400 bg-orange-100" : "border-red-400 bg-red-100"
                }`} />
                {/* Line */}
                <div className={`ml-12 flex-1 border-t-2 border-dashed ${
                  isAnnouncement ? "border-orange-300" : "border-red-300"
                }`} />
                <span className={`ml-3 text-xs font-bold px-3 py-1 rounded-full ${
                  isAnnouncement ? "bg-orange-50 text-orange-600 border border-orange-200" : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {milestoneItem.label} {formatMMDD(milestoneItem.date)}
                </span>
              </div>
            );
          }

          const taskItem = item as StepGroup;
          stepNumber++;

          return (
            <div key={`step-${taskItem.date}`} className="relative pb-2">
              {/* Step number circle */}
              <div className="absolute left-4 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                <span className="text-[11px] font-bold text-gray-500 tabular-nums">{stepNumber}</span>
              </div>

              {/* Date label + tasks */}
              <div className="ml-12 pb-4">
                <div className="text-[11px] text-gray-400 font-medium mb-2 tabular-nums">
                  ~{formatMMDD(taskItem.date)}
                </div>

                {/* Task cards - horizontal for same date */}
                <div className="flex flex-wrap gap-2">
                  {taskItem.tasks.map(task => {
                    const colors = STATUS_NODE_COLORS[task.status] ?? STATUS_NODE_COLORS["未着手"];
                    const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE["未着手"];

                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className={`flex items-center gap-3 bg-white rounded-xl border border-gray-200 border-l-4 ${colors.border} pl-4 pr-5 py-3 transition-all hover:shadow-lg hover:-translate-y-0.5 group`}
                        style={{ minWidth: 260 }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition truncate">{task.title}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${badge.className}`}>
                          {badge.text}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Connector arrow (between steps) */}
              {itemIdx < flowItems.length - 1 && (
                <div className="absolute left-4 -translate-x-1/2 bottom-0">
                  <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M6 9L2 5h8L6 9z" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
