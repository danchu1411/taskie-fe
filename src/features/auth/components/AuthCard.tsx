import { type ReactNode } from "react";

export type AuthCardProps = {
  title: string;
  badge?: string;
  description?: string;
  children: ReactNode;
};

/**
 * Authentication card component for forms like forgot password, reset password
 * 
 * Provides a clean white card with title, optional badge, description, and form content
 */
export function AuthCard({ title, badge, description, children }: AuthCardProps) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-0 -z-10 scale-[1.03] rounded-[36px] bg-gradient-to-br from-indigo-200/20 via-white to-slate-200/40 blur-3xl" aria-hidden />
      <div className="relative rounded-[32px] border border-slate-200 bg-white/95 p-6 pt-9 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-9">
        <span className="absolute left-7 right-7 top-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" aria-hidden />
        
        <header className="mb-6 text-left">
          {badge && (
            <span className="inline-flex items-center justify-center rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
              {badge}
            </span>
          )}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </header>
        
        {children}
      </div>
    </div>
  );
}
