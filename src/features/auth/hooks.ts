import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

type NavigateHandler = (path: string) => void;

/**
 * Hook for navigation in authentication pages
 * 
 * Prioritizes the onNavigate prop from page props, falls back to useNavigate
 * for programmatic navigation
 */
export function useAuthNavigation(onNavigate?: NavigateHandler) {
  const navigate = useNavigate();

  return useCallback(
    (path: string) => {
      if (onNavigate) {
        onNavigate(path);
        return;
      }
      navigate(path);
    },
    [onNavigate, navigate]
  );
}

/**
 * Hook for handling authentication redirects
 * 
 * Centralizes the logic for redirecting users after successful authentication
 * based on their verification status and preferences
 */
export function useAuthRedirect(
  auth: {
    isAuthenticated: boolean;
    shouldPromptVerification: boolean;
    user: { emailVerified?: boolean } | null;
  },
  onNavigate?: NavigateHandler,
  defaultPath: string = "/auth/success"
) {
  const navigate = useAuthNavigation(onNavigate);

  return useCallback(() => {
    if (!auth.isAuthenticated) return;

    const target = auth.shouldPromptVerification && !auth.user?.emailVerified 
      ? "/auth/verify-email" 
      : defaultPath;

    // Always use navigate for SPA navigation
    navigate(target);
    
    // Only fallback to window.location.replace if not in SPA context
    if (typeof window !== "undefined" && !onNavigate && window.location.pathname === "/login") {
      window.location.replace(target);
    }
  }, [auth, navigate, defaultPath, onNavigate]);
}
