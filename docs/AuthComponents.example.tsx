/**
 * Example usage of shared authentication components and hooks
 * 
 * This file demonstrates how to use the new shared components and hooks
 * for building authentication pages with consistent styling and behavior.
 */

import { useState } from 'react';
import { 
  AuthShell, 
  AuthCard, 
  AuthFormField, 
  AuthCheckboxRow 
} from '../src/features/auth/components';
import { useAuthNavigation, useAuthRedirect, useGoogleAuth } from '../src/features/auth/hooks';
import { useAuth } from '../src/features/auth/AuthContext';
import { detectMockEnabled } from '../src/lib/googleIdentity';

// Example 1: Login page using shared components
export function ExampleLoginPage() {
  const { login, status } = useAuth();
  const navigate = useAuthNavigation();
  const authRedirect = useAuthRedirect(useAuth(), navigate);
  const googleAuth = useGoogleAuth();
  
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await login({ 
        email: formState.email, 
        password: formState.password, 
        remember: rememberMe 
      });
      authRedirect();
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleGoogleClick = async (e: React.MouseEvent) => {
    if (e.altKey && detectMockEnabled()) {
      googleAuth.openMockDialog();
      return;
    }
    await googleAuth.signInWithGoogle(rememberMe);
  };

  return (
    <AuthShell ctaLabel="Create account" ctaHref="/signup">
      <div className="grid gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center">
        {/* Left side - marketing content */}
        <div className="relative hidden overflow-hidden rounded-[36px] border border-slate-200/70 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-10 text-left text-slate-100 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.75)] md:flex md:flex-col">
          <h2 className="text-3xl font-semibold leading-snug text-white">
            Plan with intention, focus with calm, finish with clarity.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-indigo-100/80">
            Taskie gently guides your study rhythm with adaptive schedules, mindful breaks, and progress pulses.
          </p>
        </div>

        {/* Right side - login form */}
        <AuthCard 
          title="Welcome back" 
          badge="Log in"
          description="Pick up right where you left off."
        >
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

            <button
              type="submit"
              disabled={status === "authenticating"}
              className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "authenticating" ? "Signing in..." : "Log in"}
            </button>

            <div className="relative py-2 text-center text-[11px] uppercase tracking-[0.28em] text-slate-400">
              <span className="relative z-[1] bg-white px-3">Or</span>
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" aria-hidden />
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={status === "authenticating" || googleAuth.loadingGoogle}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleAuth.loadingGoogle ? "Signing in with Google..." : "Continue with Google"}
            </button>

            {googleAuth.googleHint && (
              <p className="text-center text-xs text-emerald-600">{googleAuth.googleHint}</p>
            )}
            {googleAuth.googleError && (
              <p className="text-center text-xs text-rose-600">{googleAuth.googleError}</p>
            )}
            {detectMockEnabled() && (
              <p className="text-center text-xs text-slate-400">
                Alt+click for mock login
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
              className="text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
            >
              Create one
            </a>
          </p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}

// Example 2: Forgot password page using AuthCard
export function ExampleForgotPasswordPage() {
  const navigate = useAuthNavigation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic here
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthShell ctaLabel="Back to login" ctaHref="/login">
        <AuthCard
          title="Check your email"
          badge="Email sent"
          description="We've sent a password reset link to your email address."
        >
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
              >
                try again
              </button>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell ctaLabel="Back to login" ctaHref="/login">
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
            />
          </AuthFormField>

          <button
            type="submit"
            className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99]"
          >
            Send reset link
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
