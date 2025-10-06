import type { ReactNode } from "react";
import { useUpcomingSchedule } from "./hooks/useScheduleData";

type UpcommingProps = {
  className?: string;
  emptyState?: ReactNode;
};

export default function Upcomming({ className, emptyState }: UpcommingProps) {
  // Use centralized schedule hook for upcoming entries
  const { data, isLoading, isError } = useUpcomingSchedule(undefined);
  const error = isError ? new Error("Failed to load schedule") : null;

  const baseClass = ["space-y-4", className].filter(Boolean).join(" ");

  if (isLoading) {
    return <p className={["text-sm text-slate-500", className].filter(Boolean).join(" ")}>?ang t?i l?ch s?p t?i�c</p>;
  }

  if (error) {
    return (
      <div
        className={[
          "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        Khong th? t?i l?ch. {String((error as Error).message)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    if (emptyState) return <div className={className}>{emptyState}</div>;
    return (
      <div
        className={[
          "rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        Ch?a co l?ch lam vi?c nao.
      </div>
    );
  }

  return (
    <div className={baseClass}>
      {data.map((item) => {
        const key = item.id ?? item.schedule_id ?? `${item.work_item_id ?? "work"}-${item.start_at}`;
        const date = new Date(item.start_at);
        const minutes = item.planned_minutes ?? item.plannedMinutes ?? 0;
        return (
          <div
            key={key}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200/70 hover:shadow-xl"
          >
            <div className="text-left">
              <p className="text-base font-medium text-slate-900 transition group-hover:text-slate-900">
                {date.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Work item: {item.work_item_id ?? "?"}
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm">
              {minutes} phut
            </span>
          </div>
        );
      })}
    </div>
  );
}
