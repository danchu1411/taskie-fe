import { isAxiosError } from "axios";
import { useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "./AuthContext";

type NavigateHandler = (path: string) => void;

type ForgotPasswordProps = {
  onNavigate?: NavigateHandler;
};

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    setStatus("submitting");
    try {
      const info = await requestPasswordReset(trimmed);
      setStatus("success");
      const expires = info.expiresAt ? ` (expires ${new Date(info.expiresAt).toLocaleString()})` : "";
      const baseMessage =
        info.status === "unknown"
          ? "If an account exists, we just sent you instructions to reset your password."
          : `Verification email ${info.status}. Check your inbox${expires}.`;
      setMessage(baseMessage);
    } catch (err) {
      setStatus("idle");
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Unable to send reset email. Please try again later.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
    }
  };

  const navigateTo = (event: MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10 text-slate-900">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between pb-10">
        <a
          href="/"
          onClick={(event) => navigateTo(event, "/")}
          className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 transition hover:text-slate-900"
        >
          Taskie
        </a>
        <nav className="flex gap-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <a href="/login" onClick={(event) => navigateTo(event, "/login")} className="transition hover:text-slate-900">
            Log in
          </a>
          <a href="/signup" onClick={(event) => navigateTo(event, "/signup")} className="transition hover:text-slate-900">
            Sign up
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-10 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
          <span className="inline-flex items-center rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-indigo-600">
            Reset password
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Forgot your password?</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Enter the email associated with your Taskie account and we will send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <label htmlFor="forgot-email" className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Email address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                  if (status === "success") {
                    setStatus("idle");
                    setMessage(null);
                  }
                }}
                disabled={status === "submitting"}
                placeholder="you@example.com"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}
            {message && !error && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-500">
            <p>
              Having trouble? <a href="mailto:support@taskie.dev" className="text-slate-700 underline underline-offset-4">Contact support</a> and weÅfll help restore access to your account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
