import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import CalendarIcon from "../../components/icons/CalendarIcon";
import TimerIcon from "../../components/icons/TimerIcon";
import ChartIcon from "../../components/icons/ChartIcon";
import { useAuth } from "./AuthContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";
import { 
  AuthShell, 
  AuthFormField, 
  AuthCheckboxRow
} from "./components";
import { useAuthNavigation, useAuthRedirect } from "./hooks";

type NavigateHandler = (path: string) => void;

type TaskieLoginProps = {
  onNavigate?: NavigateHandler;
};

const loginHighlights = [
  {
    title: "Weekly rituals",
    description: "Auto-plan blocks that align with your study targets.",
    icon: CalendarIcon,
  },
  {
    title: "Focus timers",
    description: "Mindful sessions with gentle breaks to avoid burnout.",
    icon: TimerIcon,
  },
  {
    title: "Progress pulses",
    description: "Lightweight stats that celebrate momentum instead of pressure.",
    icon: ChartIcon,
  },
];

function TaskieLogin({ onNavigate }: TaskieLoginProps) {
  const { login, status, isAuthenticated, user, shouldPromptVerification } = useAuth();
  const navigate = useAuthNavigation(onNavigate);
  const authRedirect = useAuthRedirect(
    { isAuthenticated, shouldPromptVerification, user },
    onNavigate
  );
  
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmitting = status === "authenticating";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const email = formState.email.trim();
    const password = formState.password;
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      await login({ email, password, remember: rememberMe });
      authRedirect();
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Unable to log in. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to log in. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      authRedirect();
    }
  }, [isAuthenticated, authRedirect]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const resetStatus = params.get("reset");
    const isVerified = params.get('verified') === 'true';
    const verifiedEmail = params.get('email');
    
    if (resetStatus === "success") {
      setSuccessMessage("Your password has been reset successfully. You can now log in with your new password.");
      const query = new URLSearchParams(window.location.search);
      query.delete("reset");
      const hash = window.location.hash;
      const next = `${window.location.pathname}${query ? `?${query}` : ""}${hash}`;
      window.history.replaceState(null, "", next);
    } else if (isVerified && verifiedEmail) {
      // Email verification success
      setFormState(prev => ({ ...prev, email: decodeURIComponent(verifiedEmail) }));
      setSuccessMessage('Email verified successfully! Please login to continue.');
      
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
      
      // Clean up URL parameters
      const query = new URLSearchParams(window.location.search);
      query.delete("verified");
      query.delete("email");
      const hash = window.location.hash;
      const next = `${window.location.pathname}${query.toString() ? `?${query}` : ""}${hash}`;
      window.history.replaceState(null, "", next);
    }
  }, []);

  const formDisabled = isSubmitting;

  return (
    <>
      <AuthLoadingOverlay show={isSubmitting} label="Signing you in..." />
      <AuthShell 
        ctaLabel="Create account" 
        ctaHref="/signup"
        highlights={loginHighlights}
        onNavigate={navigate}
      >
        <div className="absolute inset-0 -z-10 scale-[1.03] rounded-[36px] bg-gradient-to-br from-indigo-200/20 via-white to-slate-200/40 blur-3xl" aria-hidden />
        <div className="relative rounded-[32px] border border-slate-200 bg-white/95 p-6 pt-9 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-9">
          <span className="absolute left-7 right-7 top-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" aria-hidden />
          <header className="mb-6 text-left">
            <span className="inline-flex items-center justify-center rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
              Log in
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Pick up right where you left off.</p>
          </header>
          <form onSubmit={handleSubmit} className="grid gap-4 text-left">
            <AuthFormField id="email" label="Email">
              <input
                id="email"
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
            </AuthFormField>

            <AuthFormField id="password" label="Password">
              <input
                id="password"
                type="password"
                required
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
            </AuthFormField>

            <AuthCheckboxRow
              id="remember"
              checked={rememberMe}
              onChange={setRememberMe}
              label="Remember me"
              link={{
                href: "/forgot-password",
                text: "Forgot password?",
                onClick: (e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }
              }}
            />

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}
            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={formDisabled}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Log in"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
              className="text-slate-600 underline underline-offset-4 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Create one
            </a>
          </p>
        </div>
      </AuthShell>
    </>
  );
}

export default TaskieLogin;