import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import CalendarIcon from "../../components/icons/CalendarIcon";
import TimerIcon from "../../components/icons/TimerIcon";
import ChartIcon from "../../components/icons/ChartIcon";
import { AuthCTAButtons } from "../auth/components";

type PreviewCardProps = {
  title: string;
  accent?: "indigo" | "emerald" | "slate";
  children: ReactNode;
  className?: string;
};


type TaskieLandingProps = {
  onNavigate?: (path: string) => void;
};

const accentMap = {
  indigo: {
    bar: "bg-indigo-400/40",
    ring: "focus-visible:ring-indigo-700/40",
    hover: "hover:border-indigo-300/60 hover:shadow-indigo-100",
  },
  emerald: {
    bar: "bg-emerald-400/40",
    ring: "focus-visible:ring-emerald-700/40",
    hover: "hover:border-emerald-300/60 hover:shadow-emerald-100",
  },
  slate: {
    bar: "bg-slate-400/30",
    ring: "focus-visible:ring-slate-700/40",
    hover: "hover:border-slate-300/60 hover:shadow-slate-100",
  },
} as const;

const navLinkClass =
  "relative py-1 text-[12px] text-slate-700 transition-colors after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-full after:scale-x-0 after:bg-slate-900 after:transition-transform after:duration-200 hover:text-slate-900 hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40";

function PreviewCard({ title, children, accent = "slate", className }: PreviewCardProps) {
  const palette = accentMap[accent] ?? accentMap.slate;
  const content = Children.toArray(children);
  const [icon, ...rest] = content;
  const cardClass = [
    "group relative flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 pt-6 shadow-[0_1px_0_#e5e7eb] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl overflow-hidden",
    palette.ring,
    palette.hover,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass}>
      <span className={`absolute inset-x-0 top-0 h-[3px] ${palette.bar}`} aria-hidden />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-700 transition group-hover:bg-slate-100">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-600">{rest}</div>
        </div>
      </div>
    </article>
  );
}


export default function TaskieLanding({ onNavigate }: TaskieLandingProps = {}) {
  const aboutRef = useRef<HTMLElement | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  const navigateTo = useCallback(
    (path: string) => {
      if (!path) return;
      if (onNavigate) {
        onNavigate(path);
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    },
    [onNavigate]
  );

  const goToLogin = useCallback(() => {
    navigateTo("/login");
  }, [navigateTo]);

  useEffect(() => {
    const node = aboutRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAboutVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleAboutClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLoginNavClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    goToLogin();
  };

  return (
    <div id="top" className="min-h-screen bg-neutral-50 text-slate-900 selection:bg-indigo-200 selection:text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 md:px-10">
        <a
          href="#top"
          className="group/logo inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          aria-label="Taskie home"
        >
          <img 
            src="/Logo.png" 
            alt="Taskie" 
            className="h-16 w-auto rounded-full"
          />
        </a>
        <nav className="hidden gap-6 md:flex">
          <a className={navLinkClass} href="#preview">
            Preview
          </a>
          <a className={navLinkClass} href="#about" onClick={handleAboutClick}>
            About
          </a>
          <a className={navLinkClass} href="/login" onClick={handleLoginNavClick}>
            Log in
          </a>
        </nav>
      </header>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02] [background-image:repeating-linear-gradient(90deg,transparent,transparent_63px,#0f172a_64px),repeating-linear-gradient(0deg,transparent,transparent_23px,#0f172a_24px)]"
      />

      <main className="mx-auto max-w-6xl px-6 md:px-10">
        <section className="relative min-h-[calc(100vh-140px)] py-16 md:min-h-[calc(100vh-160px)] md:py-24 lg:py-28">
          <div className="pointer-events-none absolute inset-x-0 top-[15%] -z-10 flex justify-center">
            <div className="h-64 w-[min(620px,92%)] rounded-full bg-gradient-to-r from-indigo-200/40 via-slate-200/50 to-indigo-200/40 blur-3xl" />
          </div>
          <div className="absolute bottom-12 left-1/2 hidden h-[2px] w-56 -translate-x-1/2 bg-indigo-400/40 md:block" aria-hidden />

          <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center justify-center rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
                Daily focus OS
              </span>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                Rituals that keep study momentum alive
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base text-slate-600 md:mx-0 md:text-lg">
                Taskie combines intentional planning, calm timers, and celebration of streaks so you keep moving forward every single day.
              </p>

              <AuthCTAButtons onEmailClick={goToLogin} onNavigate={onNavigate} />

              <ul className="mt-8 flex flex-col gap-3 text-left text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-5">
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" aria-hidden />
                  Adaptive weekly plans
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" aria-hidden />
                  Gentle breaks that protect focus
                </li>
                <li className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
                  Progress insights that feel encouraging
                </li>
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md md:max-w-none">
              <span className="absolute inset-x-8 top-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" aria-hidden />
              <div className="relative rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-8 lg:p-9">
                <div className="grid gap-4 sm:grid-cols-2">
                  <PreviewCard
                    title="Weekly plan"
                    accent="indigo"
                    className="sm:col-span-2 min-h-[220px] border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-indigo-100"
                  >
                    <CalendarIcon className="h-6 w-6 text-indigo-600/80" />
                    <p>Auto-generated study blocks that flex with your energy levels.</p>
                    <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                      <li className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-indigo-600">Syncs with your calendar</li>
                      <li className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-indigo-600">Adapts to priorities</li>
                    </ul>
                  </PreviewCard>
                  <PreviewCard title="Focus timer" accent="slate" className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-200/80">
                    <TimerIcon className="h-6 w-6 text-slate-700/80" />
                    <p>Pomodoro-inspired sessions with mindful reminders.</p>
                  </PreviewCard>
                  <PreviewCard title="Progress" accent="emerald" className="h-full bg-gradient-to-br from-emerald-50 via-white to-emerald-100/80 border-emerald-200/70">
                    <ChartIcon className="h-6 w-6 text-emerald-600/80" />
                    <p>Celebrate streaks, completion %, and gentle nudges forward.</p>
                  </PreviewCard>
                </div>
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs uppercase tracking-[0.32em] text-slate-500">
                  Preview mode - full experience coming soon
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          ref={aboutRef}
          className={[
            "mt-16 md:mt-24 pb-20 text-left transition-all duration-700 ease-out md:pb-24",
            aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          ].join(" ")}
        >
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(30,41,59,0.35)] transition hover:shadow-[0_30px_70px_-45px_rgba(79,70,229,0.35)] sm:p-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">About</p>
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Designed for deep study rituals</h2>
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>Taskie helps you plan focused study sessions, track progress, and keep a steady cadence. Weekly plans adapt automatically to your personal goals.</p>
              <p>Gentle timers, balanced breaks, and streak maps keep your motivation high every single day.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-slate-200/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[11px] text-slate-500 md:px-10">
          <div>&copy; {new Date().getFullYear()} Taskie</div>
          <div className="flex gap-6">
            <a className={navLinkClass} href="#terms">
              Terms
            </a>
            <a className={navLinkClass} href="#privacy">
              Privacy
            </a>
          </div>
        </div>
        <div className="mb-6 ml-6 h-[3px] w-32 bg-indigo-400/40 md:ml-10" aria-hidden />
      </footer>
    </div>
  );
}



