import { isAxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "./AuthContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";

const MIN_PASSWORD_LENGTH = 8;

type NavigateHandler = (path: string) => void;

type ResetPasswordProps = {
  onNavigate?: NavigateHandler;
};

function useTokenFromQuery() {
  return useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("token")?.trim() ?? "";
  }, []);
}

export default function ResetPassword({ onNavigate }: ResetPasswordProps) {
  const { resetPassword } = useAuth();
  const token = useTokenFromQuery();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const navigateTo = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, path: string) => {
      event.preventDefault();
      if (onNavigate) onNavigate(path);
      else if (typeof window !== "undefined") window.location.href = path;
    },
    [onNavigate],
  );

  useEffect(() => {
    if (status !== "success") return;
    const target = "/login?reset=success";
    const timer = setTimeout(() => {
      if (onNavigate) onNavigate(target);
      else if (typeof window !== "undefined") window.location.replace(target);
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, onNavigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Reset link is missing or invalid. Please request a new email.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    try {
      await resetPassword({ token, password });
      setStatus("success");
      setMessage("Your password has been reset. Redirecting you to log in...");
    } catch (err) {
      setStatus("idle");
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string; code?: string } | undefined;
        const code = data?.code ? ` (${data.code})` : "";
        setError(data?.message ?? data?.error ?? `Unable to reset password${code}. Try requesting a new email.`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to reset password. Try requesting a new email.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10 text-slate-900">
      <AuthLoadingOverlay show={status === "submitting"} label="Updating your password..." />
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
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Set your new password</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Choose a new password for your Taskie account. We'll redirect you to the sign in page once it's updated.
          </p>

          {!token && (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Reset link is missing or expired. Please request a new email.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <label htmlFor="reset-password" className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                New password
              </label>
              <input
                id="reset-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError(null);
                }}
                disabled={status === "submitting"}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="reset-password-confirm" className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                Confirm password
              </label>
              <input
                id="reset-password-confirm"
                name="passwordConfirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (error) setError(null);
                }}
                disabled={status === "submitting"}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}
            {message && !error && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting" || !token}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "submitting" ? "Updating password..." : "Update password"}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-500">
            <p>
              Need a new email? <a href="/forgot-password" onClick={(event) => navigateTo(event, "/forgot-password")} className="text-slate-700 underline underline-offset-4">Request another reset link</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
