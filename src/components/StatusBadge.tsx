interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  "未着手": { label: "未着手", className: "bg-gray-100 text-gray-600 border-gray-200" },
  "進行中": { label: "進行中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  "確認待ち": { label: "確認待ち", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  "完了": { label: "完了", className: "bg-green-50 text-green-700 border-green-200" },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
