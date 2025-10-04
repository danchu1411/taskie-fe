import { type MouseEvent } from "react";
import GoogleIcon from "../../../components/icons/GoogleIcon";
import { useGoogleAuth } from "../useGoogleAuth";
import { AuthGoogleMockDialog } from "./AuthGoogleMockDialog";
import { detectMockEnabled } from "../../../lib/googleIdentity";

export type AuthCTAButtonsProps = {
  onEmailClick?: () => void;
  onNavigate?: (path: string) => void;
  showGoogle?: boolean;
};

/**
 * Call-to-action buttons for authentication
 * 
 * Provides consistent login/signup buttons with optional Google OAuth
 * for landing pages and other marketing contexts
 */
export function AuthCTAButtons({ 
  onEmailClick, 
  onNavigate,
  showGoogle = true 
}: AuthCTAButtonsProps) {
  const googleAuth = useGoogleAuth();

  const handleGoogleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (event.altKey && detectMockEnabled()) {
      googleAuth.openMockDialog();
      return;
    }
    await googleAuth.signInWithGoogle(true); // Default to remember
  };

  const handleEmailClick = () => {
    if (onEmailClick) {
      onEmailClick();
    } else if (onNavigate) {
      onNavigate("/login");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          onClick={handleEmailClick}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] sm:w-auto"
        >
          Get started
        </button>
        
        {showGoogle && (
          <button
            onClick={handleGoogleClick}
            disabled={googleAuth.loadingGoogle}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <GoogleIcon className="h-4 w-4" />
            {googleAuth.loadingGoogle ? "Signing in..." : "Continue with Google"}
          </button>
        )}
      </div>

      {googleAuth.googleHint && (
        <p className="text-center text-xs text-emerald-600">{googleAuth.googleHint}</p>
      )}
      {googleAuth.googleError && (
        <p className="text-center text-xs text-rose-600">{googleAuth.googleError}</p>
      )}
      {detectMockEnabled() && showGoogle && (
        <p className="text-center text-xs text-slate-400">
          Alt+click for mock login
        </p>
      )}

      <AuthGoogleMockDialog
        open={googleAuth.showMockDialog}
        onClose={googleAuth.closeMockDialog}
        onSubmit={googleAuth.submitMock}
        loading={googleAuth.loadingGoogle}
        error={googleAuth.googleError}
      />
    </>
  );
}
