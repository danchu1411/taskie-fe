import { Children, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import GoogleIcon from "../../components/icons/GoogleIcon";
import CalendarIcon from "../../components/icons/CalendarIcon";
import TimerIcon from "../../components/icons/TimerIcon";
import ChartIcon from "../../components/icons/ChartIcon";

type PreviewCardProps = {
  title: string;
  accent?: "indigo" | "emerald" | "slate";
  children: ReactNode;
  className?: string;
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
          <div className="text-sm text-slate-600">{rest}</div>
        </div>
      </div>
    </article>
  );
}

function AuthButtons() {
  return (
    <div className="mt-6 grid place-items-center gap-4 md:mt-10">
      <button
        type="button"
        className="inline-flex w-[320px] max-w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99]"
        aria-label="Continue with Google"
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </button>
      <button
        type="button"
        className="inline-flex w-[320px] max-w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99]"
        aria-label="Continue with email"
      >
        Continue with email
      </button>
    </div>
  );
}

export default function TaskieLanding() {
  const aboutRef = useRef<HTMLElement | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

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

  return (
    <div id="top" className="min-h-screen bg-neutral-50 text-slate-900 selection:bg-indigo-200 selection:text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-5 md:px-10">
        <a
          href="#top"
          className="group/logo inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-700 transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          aria-label="Taskie home"
        >
          <span className="transition-all duration-200 group-hover/logo:bg-gradient-to-r group-hover/logo:from-indigo-500 group-hover/logo:via-purple-500 group-hover/logo:to-slate-900 group-hover/logo:text-transparent group-hover/logo:bg-clip-text">
            Taskie
          </span>
        </a>
        <nav className="hidden gap-6 md:flex">
          <a className={navLinkClass} href="#preview">
            Preview
          </a>
          <a className={navLinkClass} href="#about" onClick={handleAboutClick}>
            About
          </a>
        </nav>
      </header>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02] [background-image:repeating-linear-gradient(90deg,transparent,transparent_63px,#0f172a_64px),repeating-linear-gradient(0deg,transparent,transparent_23px,#0f172a_24px)]"
      />

      <main className="mx-auto max-w-5xl px-6 md:px-10">
        <section className="relative flex min-h-[70vh] flex-col justify-center py-16 text-center md:py-24 lg:py-28">
          <div className="absolute bottom-12 left-1/2 h-[2px] w-56 -translate-x-1/2 bg-indigo-400/40" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-[20%] -z-10 flex justify-center">
            <div className="h-64 w-[min(580px,90%)] rounded-full bg-gradient-to-r from-indigo-200/40 via-slate-200/60 to-indigo-200/40 blur-3xl" />
          </div>

          <h1 className="text-5xl font-bold leading-none tracking-tight text-slate-900 transition-transform duration-500 ease-out group-hover:scale-[1.03] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-slate-900 md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-transparent">Taskie</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">Study smarter, daily.</p>

          <section id="preview" className="py-8 md:py-12">
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              <PreviewCard title="Weekly plan" accent="indigo">
                <CalendarIcon className="h-6 w-6 text-indigo-600/80" />
                <p className="mt-2 text-sm">Auto-generated study blocks aligned to your goals.</p>
              </PreviewCard>
              <PreviewCard title="Focus timer" accent="slate">
                <TimerIcon className="h-6 w-6 text-slate-700/80" />
                <p className="mt-2 text-sm">Pomodoro sessions with gentle breaks and stats.</p>
              </PreviewCard>
              <PreviewCard title="Progress" accent="emerald">
                <ChartIcon className="h-6 w-6 text-emerald-600/80" />
                <p className="mt-2 text-sm">Streaks, completion %, and trend insights.</p>
              </PreviewCard>
            </div>
          </section>

          <AuthButtons />

          <p className="mt-8 text-sm text-slate-500">
            No account?{' '}
            <a
              href="#create"
              className="underline decoration-indigo-500/60 underline-offset-4 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Create one
            </a>
          </p>
        </section>

        <section
          id="about"
          ref={aboutRef}
          className={`pb-20 text-left md:pb-24 transition-all duration-700 ease-out ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-[11px] text-slate-500 md:px-10">
          <div>c {new Date().getFullYear()} Taskie</div>
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










