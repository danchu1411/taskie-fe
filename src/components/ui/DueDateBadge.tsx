import React from "react";

// Utility function
function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface DueDateBadgeProps {
  deadline?: string;
  className?: string;
}

function formatDate(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `In ${diffDays}d`;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export default function DueDateBadge({ deadline, className }: DueDateBadgeProps) {
  if (!deadline) return null;

  const date = new Date(deadline);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0;
  const isToday = diffDays === 0;
  const isTomorrow = diffDays === 1;

  let label = formatDate(deadline);
  let badgeClassName = "bg-slate-100 text-slate-700 border-slate-200";

  if (isOverdue) {
    badgeClassName = "bg-red-100 text-red-700 border-red-200";
  } else if (isToday) {
    badgeClassName = "bg-blue-100 text-blue-700 border-blue-200";
  } else if (isTomorrow) {
    badgeClassName = "bg-amber-100 text-amber-700 border-amber-200";
  }

  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
      badgeClassName,
      className
    )}>
      📅 {label}
      {formatTime(deadline) && ` • ${formatTime(deadline)}`}
    </span>
  );
}

