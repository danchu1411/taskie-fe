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
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.emailVerified) {
      if (pathname !== "/auth/success") {
        navigate("/auth/success");
      }
      return;
    }
    if (pathname !== "/auth/verify-email") {
      navigate("/auth/verify-email");
    }
  }, [isAuthenticated, user?.emailVerified, pathname, navigate]);

  if (!isAuthenticated && pathname === "/login") {
    return <TaskieLogin onNavigate={navigate} />;
  }

  if (!isAuthenticated && pathname === "/signup") {
    return <TaskieSignup onNavigate={navigate} />;
  }

  if (pathname === "/auth/verify-email" || (isAuthenticated && !user?.emailVerified)) {
    return <VerifyEmail onNavigate={navigate} />;
  }

  if ((isAuthenticated && user?.emailVerified) || pathname === "/auth/success") {
    return <AuthSuccess onNavigate={navigate} />;
  }

  return <TaskieLanding onNavigate={navigate} />;
}

export type { NavigateFn };
export default App;




