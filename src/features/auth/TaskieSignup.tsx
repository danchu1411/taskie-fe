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
];

export default function TaskieSignup({ onNavigate }: TaskieSignupProps) {
  const { signUp, status, isAuthenticated, user, shouldPromptVerification } = useAuth();
  const navigate = useAuthNavigation(onNavigate);
  const authRedirect = useAuthRedirect(
    { isAuthenticated, shouldPromptVerification, user },
    onNavigate
  );
  
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      // Redirect will be handled by useEffect
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Unable to sign up. Please try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign up. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      authRedirect();
    } else if (shouldPromptVerification && user && !user.emailVerified) {
      // Redirect to verify email page after signup
      if (onNavigate) {
        onNavigate("/auth/verify-email");
      } else {
        window.location.href = "/auth/verify-email";
      }
    }
  }, [isAuthenticated, shouldPromptVerification, user, authRedirect, onNavigate]);

  const formDisabled = isSubmitting;

  return (
    <>
      <AuthLoadingOverlay show={isSubmitting} label="Creating your account..." />
      <AuthShell 
        ctaLabel="Back to login" 
        ctaHref="/login"
        highlights={signupHighlights}
        onNavigate={navigate}
      >
        <div className="absolute inset-0 -z-10 scale-[1.03] rounded-[36px] bg-gradient-to-br from-indigo-200/20 via-white to-slate-200/40 blur-3xl" aria-hidden />
        <div className="relative rounded-[32px] border border-slate-200 bg-white/95 p-6 pt-9 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-9">
          <span className="absolute left-7 right-7 top-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400" aria-hidden />
          <header className="mb-6 text-left">
            <span className="inline-flex items-center justify-center rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
              Create account
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Join Taskie</h1>
            <p className="mt-1 text-sm text-slate-500">Start building your daily study rhythm.</p>
          </header>
          <form onSubmit={handleSubmit} className="grid gap-4 text-left">
            <AuthFormField id="name" label="Name (optional)">
              <input
                id="name"
                type="text"
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                placeholder="Your name"
              />
            </AuthFormField>

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
            />

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={formDisabled}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
              className="text-slate-600 underline underline-offset-4 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Log in
            </a>
          </p>
        </div>
      </AuthShell>
    </>
  );
}