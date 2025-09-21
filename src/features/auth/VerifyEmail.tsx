import { isAxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useAuth } from "./AuthContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";

type NavigateHandler = (path: string) => void;

type VerifyEmailProps = {
  onNavigate?: NavigateHandler;
};

type SubmissionState = "idle" | "verifying" | "success";

function readTokenFromLocation(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token")?.trim() ?? "";
}

export default function VerifyEmail({ onNavigate }: VerifyEmailProps) {
  const { user, verification, resendVerification, verifyEmail, isAuthenticated } = useAuth();
  const [checkState, setCheckState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const initialToken = useMemo(readTokenFromLocation, []);

  const handleVerifyToken = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (!trimmed) return;
      setCheckState("verifying");
      setMessage("Verifying token, please wait...");
      setError(null);
      try {
        await verifyEmail(trimmed);
        setCheckState("success");
        setMessage("Your email has been verified. You can go back to Taskie now.");
      } catch (err) {
        setCheckState("idle");
        if (isAxiosError(err)) {
          const data = err.response?.data as { message?: string; error?: string; code?: string } | undefined;
          const suffix = data?.code ? ` (${data.code})` : "";
          setError(data?.message ?? data?.error ?? `Verification failed${suffix}. Please open the link from your email again.`);
        } else {
          setError("Verification failed. Please open the link from your email again.");
        }
      }
    },
    [verifyEmail]
  );

  useEffect(() => {
    if (!initialToken) return;
    void handleVerifyToken(initialToken);
  }, [initialToken, handleVerifyToken]);

  const handleResend = useCallback(async () => {
    if (!user?.email) {
      setError("You need to log in to resend the verification email.");
      return;
    }
    setResendLoading(true);
    setError(null);
    setMessage(null);
    try {
      const info = await resendVerification();
      const expiresLabel = info.expiresAt ? ` (expires ${new Date(info.expiresAt).toLocaleString()})` : "";
      setMessage(`Verification email ${info.status}. Check your inbox${expiresLabel}.`);
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message ?? data?.error ?? "Unable to resend verification email.");
      } else {
        setError("Unable to resend verification email.");
      }
    } finally {
      setResendLoading(false);
    }
  }, [resendVerification, user?.email]);

  const handleNav = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, path: string) => {
      event.preventDefault();
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

  const openMailClient = () => {
    if (typeof window === "undefined") return;
    window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
  };

  const isVerified = Boolean(user?.emailVerified);
  const disabled = checkState === "verifying";
  const heading = isVerified ? "Email verified" : "Check your inbox to verify";
  const subheading = isVerified
    ? "You're all set. Enjoy Taskie!"
    : `We sent a verification email to ${user?.email ?? "your inbox"}. Open it and click the button to activate your account.`;

  const showOverlay = checkState === "verifying" || resendLoading;
  const overlayMessage = checkState === "verifying" ? "Verifying your email..." : "Sending verification email...";

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10 text-slate-900">
      <AuthLoadingOverlay show={showOverlay} label={overlayMessage} />
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between pb-10">
        <a
          href="/"
          onClick={(event) => handleNav(event, "/")}
          className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 transition hover:text-slate-900"
        >
          Taskie
        </a>
        <nav className="flex gap-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          <a href="/login" onClick={(event) => handleNav(event, "/login")} className="transition hover:text-slate-900">
            Log in
          </a>
          <a href="/signup" onClick={(event) => handleNav(event, "/signup")} className="transition hover:text-slate-900">
            Sign up
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-10 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur">
          <span className="inline-flex items-center rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-indigo-600">
            Verify email
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{heading}</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">{subheading}</p>

          {verification && !isVerified && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="font-semibold uppercase tracking-[0.18em] text-slate-500">Latest status</div>
              <p className="mt-1">
                Status: <span className="font-medium text-slate-800">{verification.status}</span>
              </p>
              {verification.expiresAt && (
                <p className="text-xs text-slate-500">
                  Expires: {new Date(verification.expiresAt).toLocaleString()}
                </p>
              )}
              {verification.lastRequestedAt && (
                <p className="text-xs text-slate-500">
                  Last requested: {new Date(verification.lastRequestedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {message && !error && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            {!isVerified && (
              <button
                type="button"
                onClick={openMailClient}
                className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
              >
                Open Gmail
              </button>
            )}
            {!isVerified && (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resendLoading || disabled}
                className="inline-flex h-11 flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendLoading ? "Sending..." : "Resend email"}
              </button>
            )}
            {isVerified && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate("/auth/success");
                  else if (typeof window !== "undefined") window.location.replace("/auth/success");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
              >
                Continue to Taskie
              </button>
            )}
          </div>

          {!isVerified && (
            <div className="mt-6 text-sm text-slate-500">
              <p>
                Already clicked the link? This page updates automatically once the backend confirms. If nothing happens after a few minutes, resend the email or check your spam folder.
              </p>
              {checkState === "verifying" && (
                <p className="mt-2 text-xs text-slate-500">Checking status...</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
