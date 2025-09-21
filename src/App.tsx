import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./features/auth/AuthContext";
import TaskieLanding from "./features/landing/TaskieLanding";
import TaskieLogin from "./features/auth/TaskieLogin";
import TaskieSignup from "./features/auth/TaskieSignup";
import VerifyEmail from "./features/auth/VerifyEmail";
import AuthSuccess from "./features/auth/AuthSuccess";

type NavigateFn = (path: string) => void;

const DEFAULT_ROUTE = "/";

function getCurrentPath() {
  if (typeof window !== "undefined" && window.location?.pathname) {
    return window.location.pathname;
  }
  return DEFAULT_ROUTE;
}

function usePathname() {
  const [pathname, setPathname] = useState<string>(getCurrentPath);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => setPathname(getCurrentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback<NavigateFn>(
    (nextPath) => {
      if (!nextPath || nextPath === pathname) return;
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", nextPath);
      }
      setPathname(nextPath);
    },
    [pathname]
  );

  return { pathname, navigate };
}

function App() {
  const { pathname, navigate } = usePathname();
  const { isAuthenticated, user, shouldPromptVerification } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (shouldPromptVerification && !user?.emailVerified) {
      if (pathname !== "/auth/verify-email") {
        navigate("/auth/verify-email");
      }
      return;
    }
    if (pathname !== "/auth/success") {
      navigate("/auth/success");
    }
  }, [isAuthenticated, shouldPromptVerification, user?.emailVerified, pathname, navigate]);

  if (!isAuthenticated) {
    if (pathname === "/login") {
      return <TaskieLogin onNavigate={navigate} />;
    }
    if (pathname === "/signup") {
      return <TaskieSignup onNavigate={navigate} />;
    }
    if (pathname === "/auth/verify-email") {
      return <VerifyEmail onNavigate={navigate} />;
    }
    return <TaskieLanding onNavigate={navigate} />;
  }

  if (shouldPromptVerification && !user?.emailVerified) {
    return <VerifyEmail onNavigate={navigate} />;
  }

  return <AuthSuccess onNavigate={navigate} />;
}

export type { NavigateFn };
export default App;
