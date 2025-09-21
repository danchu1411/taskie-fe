import type { ReactNode } from "react";

type AuthLoadingOverlayProps = {
  show: boolean;
  label?: ReactNode;
};

export default function AuthLoadingOverlay({ show, label }: AuthLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm">
      <div
        role="status"
        aria-live="assertive"
        className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/90 px-6 py-4 text-sm font-medium text-slate-700 shadow-xl"
      >
        <span className="relative flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
        </span>
        <span>{label ?? "Please hold on..."}</span>
      </div>
    </div>
  );
}
