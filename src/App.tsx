import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./features/auth/AuthContext";
import TaskieLanding from "./features/landing/TaskieLanding";
import TaskieLogin from "./features/auth/TaskieLogin";
import TaskieSignup from "./features/auth/TaskieSignup";
import VerifyEmail from "./features/auth/VerifyEmail";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import AuthSuccess from "./features/auth/AuthSuccess";
import TodayPage from "./features/schedule/TodayPage";
import TasksPage from "./features/tasks/TasksPage";

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
    [pathname],
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

    if (pathname === "/auth/verify-email") {
      navigate("/today");
      return;
    }

    if (pathname !== "/today" && pathname !== "/tasks" && pathname !== "/auth/success") {
      navigate("/today");
    }
  }, [isAuthenticated, shouldPromptVerification, user?.emailVerified, pathname, navigate]);

  if (!isAuthenticated) {
    if (pathname === "/login") {
      return <TaskieLogin onNavigate={navigate} />;
    }
    if (pathname === "/signup") {
      return <TaskieSignup onNavigate={navigate} />;
    }
    if (pathname === "/forgot-password") {
      return <ForgotPassword onNavigate={navigate} />;
    }
    if (pathname === "/reset-password") {
      return <ResetPassword onNavigate={navigate} />;
    }
    if (pathname === "/auth/verify-email") {
      return <VerifyEmail onNavigate={navigate} />;
    }
    return <TaskieLanding onNavigate={navigate} />;
  }

  if (shouldPromptVerification && !user?.emailVerified) {
    return <VerifyEmail onNavigate={navigate} />;
  }

  if (pathname === "/auth/success") {
    return <AuthSuccess onNavigate={navigate} />;
  }

  if (pathname === "/tasks") {
    return <TasksPage onNavigate={navigate} />;
  }

  return <TodayPage onNavigate={navigate} />;
}

export type { NavigateFn };
export default App;
