import { type ReactNode } from "react";

export type AuthHighlight = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type AuthShellProps = {
  ctaLabel: string;
  ctaHref: string;
  children: ReactNode;
  highlights?: AuthHighlight[];
  onNavigate?: (path: string) => void;
};

/**
 * Standard authentication page layout
 *
 * Provides consistent header with CTA link, main content area, and footer
 * for all authentication pages (login, signup, forgot password, etc.)
 */
export function AuthShell({ ctaLabel, ctaHref, children, highlights, onNavigate }: AuthShellProps) {
  const hasHighlights = Boolean(highlights && highlights.length > 0);
  const mainClass = hasHighlights
    ? "mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 md:px-10"
    : "mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-12 md:px-10";
  const gridClass = hasHighlights
    ? "grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:justify-items-center"
    : "grid gap-10 place-items-center";

  return (
    <div className="relative min-h-screen bg-neutral-50 text-slate-900 selection:bg-indigo-200/70 selection:text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) {
              onNavigate("/");
            } else {
              window.location.href = "/";
            }
          }}
          className="group inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <img 
            src="/Logo.png" 
            alt="Taskie" 
            className="h-10 w-auto rounded-full"
          />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) {
              onNavigate(ctaHref);
            } else {
              window.location.href = ctaHref;
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:-translate-y-[1px] hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <span>{ctaLabel}</span>
        </button>
      </header>

      <main className={mainClass}>
        <div className={gridClass}>
          {hasHighlights && highlights && (
            <div className="relative hidden overflow-hidden rounded-[36px] border border-slate-200/70 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-10 text-left text-slate-100 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.75)] md:flex md:flex-col">
              <div className="relative">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-indigo-100">
                  Taskie rituals
                </span>
                <h2 className="mt-6 text-3xl font-semibold leading-snug text-white">
                  Plan with intention, focus with calm, finish with clarity.
                </h2>
                <p className="mt-3 max-w-sm text-sm text-indigo-100/80">
                  Taskie gently guides your study rhythm with adaptive schedules, mindful breaks, and progress pulses that celebrate consistency.
                </p>
              </div>
              <ul className="mt-10 grid gap-4 text-sm text-indigo-50/90">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 shadow-[0_16px_28px_-24px_rgba(148,163,184,0.6)] backdrop-blur-sm"
                    >
                      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                        <Icon className="h-5 w-5 text-indigo-100" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-indigo-100/80">{item.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.32em] text-indigo-100/70">
                Trusted by learners building daily rituals
              </div>
            </div>
          )}
          <div className="relative mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </main>

      <footer className="mt-4 border-t border-slate-200/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-[11px] text-slate-500 md:px-10 md:py-5">
          <div>&copy; {new Date().getFullYear()} Taskie</div>
          <div className="flex gap-6">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate("#terms");
                } else {
                  window.location.href = "#terms";
                }
              }}
              className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Terms
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate("#privacy");
                } else {
                  window.location.href = "#privacy";
                }
              }}
              className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}