import { isAxiosError } from "axios";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import GoogleIcon from "../../components/icons/GoogleIcon";
import CalendarIcon from "../../components/icons/CalendarIcon";
import TimerIcon from "../../components/icons/TimerIcon";
import ChartIcon from "../../components/icons/ChartIcon";
import { useAuth } from "./AuthContext";

type NavigateHandler = (path: string) => void;

type TaskieSignupProps = {
  onNavigate?: NavigateHandler;
};

const signupHighlights = [
  {
    title: "Intentional planning",
    description: "Structure daily focus blocks that fit your energy levels.",
    icon: CalendarIcon,
  },
  {
    title: "Kind reminders",
    description: "Timers and breaks that protect concentration instead of exhausting you.",
    icon: TimerIcon,
  },
  {
    title: "Progress that encourages",
    description: "Celebrate momentum with simple, uplifting insights.",
    icon: ChartIcon,
  },
] as const;

export default function TaskieSignup({ onNavigate }: TaskieSignupProps) {
  const { signUp, status, isAuthenticated, user } = useAuth();
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleHint, setGoogleHint] = useState<string | null>(null);
  const isSubmitting = status === "authenticating";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const name = formState.name.trim();
    const email = formState.email.trim();
    const password = formState.password;
    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }

    try {
      await signUp({ name: name || undefined, email, password, remember: rememberMe });
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Unable to sign up. Please try again.");
      } else {
        setError("Unable to sign up. Please try again.");
      }
    }
  };

  const handleNav = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const target = user?.emailVerified ? "/auth/success" : "/auth/verify-email";
    if (onNavigate) {
      onNavigate(target);
    } else if (typeof window !== "undefined") {
      window.location.replace(target);
    }
  }, [isAuthenticated, user?.emailVerified, onNavigate]);

  const handleGoogleClick = () => {
    setGoogleHint("Google signup is coming soon. Please use email & password for now.");
    setTimeout(() => setGoogleHint(null), 5000);
  };

  const formDisabled = isSubmitting;

  return (
    <div className="relative min-h-screen bg-neutral-50 text-slate-900 selection:bg-indigo-200/70 selection:text-slate-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <a
          href="/"
          onClick={(event) => handleNav(event, "/")}
          className="group inline-flex items-center justify-center rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-700 transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <span className="transition-all duration-200 group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-slate-900 group-hover:bg-clip-text group-hover:text-transparent">
            Taskie
          </span>
        </a>
        <a
          href="/login"
          onClick={(event) => handleNav(event, "/login")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:-translate-y-[1px] hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          <span>?a co tai kho?n?</span>
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 md:px-10">
        <div className="mx-auto w-full max-w-md text-center md:hidden">
          <span className="inline-flex items-center justify-center rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
            Create your ritual
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Sign up for Taskie</h1>
          <p className="mt-2 text-sm text-slate-500">Start building daily study momentum with rituals that feel good.</p>
        </div>

        <section className="mt-10 flex flex-1 flex-col justify-center">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
            <div className="relative hidden overflow-hidden rounded-[36px] border border-slate-200/70 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-10 text-left text-slate-100 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.75)] md:flex md:flex-col">
              <div className="relative">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-indigo-100">
                  What you'll unlock
                </span>
                <h2 className="mt-6 text-3xl font-semibold leading-snug text-white">
                  Make consistent progress without burning out.
                </h2>
                <p className="mt-3 max-w-sm text-sm text-indigo-100/80">
                  Taskie gives you a gentle operating system for study: clear rituals, calm focus, and progress that builds confidence.
                </p>
              </div>
              <ul className="mt-10 grid gap-4 text-sm text-indigo-50/90">
                {signupHighlights.map((item) => {
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
                Join learners building mindful habits every day
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 -z-10 scale-[1.03] rounded-[36px] bg-gradient-to-br from-indigo-200/20 via-white to-slate-200/40 blur-3xl" aria-hidden />
              <div className="relative rounded-[32px] border border-slate-200 bg-white/95 p-6 pt-9 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-9">
                <span className="absolute left-7 right-7 top-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" aria-hidden />
                <header className="mb-6 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">Create account</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Hello there</h1>
                  <p className="mt-1 text-sm text-slate-500">Finish setting up your study OS in a minute.</p>
                </header>
                <form className="grid gap-4 text-left" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <label htmlFor="signup-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Name (optional)
                    </label>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formState.name}
                      disabled={formDisabled}
                      onChange={(event) => {
                        setFormState((prev) => ({ ...prev, name: event.target.value }));
                        if (error) setError(null);
                      }}
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="signup-email" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Email
                    </label>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formState.email}
                      disabled={formDisabled}
                      onChange={(event) => {
                        setFormState((prev) => ({ ...prev, email: event.target.value }));
                        if (error) setError(null);
                      }}
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="signup-password" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={formState.password}
                      disabled={formDisabled}
                      onChange={(event) => {
                        setFormState((prev) => ({ ...prev, password: event.target.value }));
                        if (error) setError(null);
                      }}
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-slate-500">
                    <label className="inline-flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                        checked={rememberMe}
                        disabled={formDisabled}
                        onChange={(event) => {
                          setRememberMe(event.target.checked);
                          if (error) setError(null);
                        }}
                      />
                      <span>Remember me</span>
                    </label>
                    <a
                      href="/login"
                      onClick={(event) => handleNav(event, "/login")}
                      className="text-slate-600 underline underline-offset-4 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                    >
                      Already have an account?
                    </a>
                  </div>
                  {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={formDisabled}
                    className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Signing up..." : "Create account"}
                  </button>
                  <div className="relative py-2 text-center text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    <span className="relative z-[1] bg-white px-3">Or</span>
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={formDisabled}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Continue with Google"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Continue with Google
                  </button>
                  {googleHint && <p className="text-center text-xs text-slate-500">{googleHint}</p>}
                </form>
                <p className="mt-6 text-center text-sm text-slate-500">
                  Khi t?o tai kho?n, b?n ??ng y v?i ?i?u kho?n va chinh sach c?a Taskie.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-8 border-t border-slate-200/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[11px] text-slate-500 md:px-10">
          <div>&copy; {new Date().getFullYear()} Taskie</div>
          <div className="flex gap-6">
            <a className="transition hover:text-slate-900" href="#terms">
              Terms
            </a>
            <a className="transition hover:text-slate-900" href="#privacy">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}


