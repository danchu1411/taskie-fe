import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import AuthLoadingOverlay from "./AuthLoadingOverlay";
import { AuthShell, AuthCard, AuthFormField } from "./components";
import { useAuthNavigation } from "./hooks";

type NavigateHandler = (path: string) => void;

type ForgotPasswordProps = {
  onNavigate?: NavigateHandler;
};

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { requestPasswordReset } = useAuth();
  const navigate = useAuthNavigation(onNavigate);
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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
    }
  };

  const isSubmitting = status === "submitting";

  const supportNote = (
    <p className="mt-6 text-center text-xs text-slate-400">
      Need help? <a href="mailto:support@taskie.dev" className="text-slate-500 underline underline-offset-4 hover:text-slate-700">Contact support</a>
    </p>
  );

  if (status === "success") {
    return (
      <>
        <AuthLoadingOverlay show={isSubmitting} label="Sending reset email..." />
        <AuthShell ctaLabel="Back to login" ctaHref="/login" onNavigate={navigate}>
          <AuthCard
            title="Check your email"
            badge="Email sent"
            description="We've sent a password reset link to your email address."
          >
            <div className="text-center">
              <p className="mb-4 text-sm text-slate-500">{message}</p>
              <p className="text-sm text-slate-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setStatus("idle")}
                  className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
                >
                  try again
                </button>
              </p>
            </div>
            {supportNote}
          </AuthCard>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <AuthLoadingOverlay show={isSubmitting} label="Sending reset email..." />
      <AuthShell ctaLabel="Back to login" ctaHref="/login" onNavigate={navigate}>
        <AuthCard
          title="Reset your password"
          badge="Forgot password"
          description="Enter your email address and we'll send you a link to reset your password."
        >
          <form onSubmit={handleSubmit} className="grid gap-4 text-left">
            <AuthFormField id="email" label="Email">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                placeholder="your@email.com"
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
              {isSubmitting ? "Sending reset link..." : "Send reset link"}
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