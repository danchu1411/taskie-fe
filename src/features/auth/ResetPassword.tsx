import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";
import { AuthShell, AuthCard, AuthFormField } from "./components";
import { useAuthNavigation } from "./hooks";

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
  const navigate = useAuthNavigation(onNavigate);
  const token = useTokenFromQuery();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "success") return;
    const target = "/login?reset=success";
    const timer = setTimeout(() => {
      navigate(target);
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const supportNote = (
    <p className="mt-6 text-center text-xs text-slate-400">
      Need help? <a href="mailto:support@taskie.dev" className="text-slate-500 underline underline-offset-4 hover:text-slate-700">Contact support</a>
    </p>
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
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
      setMessage("Your password has been reset successfully. Redirecting to login...");
    } catch (err) {
      setStatus("idle");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to reset password. Please try again or request a new reset link.");
      }
    }
  };

  const isSubmitting = status === "submitting";

  if (status === "success") {
    return (
      <>
        <AuthLoadingOverlay show={isSubmitting} label="Resetting password..." />
        <AuthShell ctaLabel="Back to login" ctaHref="/login" onNavigate={navigate}>
          <AuthCard
            title="Password reset successful"
            badge="Success"
            description="Your password has been updated successfully."
          >
            <div className="text-center">
              <p className="mb-4 text-sm text-slate-500">{message}</p>
              <p className="text-sm text-slate-500">You can now log in with your new password.</p>
            </div>
            {supportNote}
          </AuthCard>
        </AuthShell>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <AuthShell ctaLabel="Back to login" ctaHref="/login" onNavigate={navigate}>
          <AuthCard
            title="Invalid reset link"
            badge="Error"
            description="This password reset link is invalid or has expired."
          >
            <div className="text-center">
              <p className="mb-4 text-sm text-slate-500">
                Please request a new password reset link.
              </p>
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99]"
              >
                Request new reset link
              </a>
            </div>
            {supportNote}
          </AuthCard>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <AuthLoadingOverlay show={isSubmitting} label="Resetting password..." />
      <AuthShell ctaLabel="Back to login" ctaHref="/login" onNavigate={navigate}>
        <AuthCard
          title="Set new password"
          badge="Reset password"
          description="Enter your new password below."
        >
          <form onSubmit={handleSubmit} className="grid gap-4 text-left">
            <AuthFormField id="password" label="New password">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              />
            </AuthFormField>

            <AuthFormField id="confirmPassword" label="Confirm password">
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                placeholder="Confirm your new password"
              />
            </AuthFormField>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>

          {supportNote}

          <p className="mt-6 text-center text-sm text-slate-500">
            Remember your password?{' '}
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
        </AuthCard>
      </AuthShell>
    </>
  );
}