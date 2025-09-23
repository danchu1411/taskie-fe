import { useCallback, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import TaskieLanding from "./features/landing/TaskieLanding";
import TaskieLogin from "./features/auth/TaskieLogin";
import TaskieSignup from "./features/auth/TaskieSignup";
import VerifyEmail from "./features/auth/VerifyEmail";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import AuthSuccess from "./features/auth/AuthSuccess";
import TodayPage from "./features/schedule/TodayPage";
import PlannerPage from "./features/schedule/PlannerPage";
import TasksPage from "./features/tasks/TasksPage";

type NavigateHandler = (path: string) => void;

type AuthSnapshot = ReturnType<typeof useAuth>;

function useNavigationHandler(): NavigateHandler {
  const navigate = useNavigate();
  return useCallback(
    (path: string) => {
      if (!path) return;
      navigate(path);
    },
    [navigate],
  );
}

function resolveAuthenticatedDestination(auth: AuthSnapshot) {
  if (auth.shouldPromptVerification && !auth.user?.emailVerified) {
    return "/auth/verify-email";
  }
  return "/today";
}

function RequireAuthRoute({
  children,
  allowUnverified = false,
}: {
  children: ReactElement;
  allowUnverified?: boolean;
}) {
  const auth = useAuth();
  const needsVerification = auth.shouldPromptVerification && !auth.user?.emailVerified;

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowUnverified && needsVerification) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  return children;
}

function LandingRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

  return <TaskieLanding onNavigate={navigate} />;
}

function LoginRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

      return <TaskieLogin onNavigate={navigate} />;
    }

function SignupRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

      return <TaskieSignup onNavigate={navigate} />;
    }

function ForgotPasswordRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

      return <ForgotPassword onNavigate={navigate} />;
    }

function ResetPasswordRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

      return <ResetPassword onNavigate={navigate} />;
    }

function VerifyEmailRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();
  const needsVerification = auth.shouldPromptVerification && !auth.user?.emailVerified;

  if (auth.isAuthenticated && !needsVerification) {
    return <Navigate to="/today" replace />;
  }

    return <VerifyEmail onNavigate={navigate} />;
  }

function AuthSuccessRoute() {
  const navigate = useNavigationHandler();

  return (
    <RequireAuthRoute>
      <AuthSuccess onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function TodayRoute() {
  const navigate = useNavigationHandler();

  return (
    <RequireAuthRoute>
      <TodayPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function TasksRoute() {
  const navigate = useNavigationHandler();

  return (
    <RequireAuthRoute>
      <TasksPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function PlannerRoute() {
  const navigate = useNavigationHandler();

  return (
    <RequireAuthRoute>
      <PlannerPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function NotFoundRoute() {
  const auth = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
  }

  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route path="/reset-password" element={<ResetPasswordRoute />} />
      <Route path="/auth/verify-email" element={<VerifyEmailRoute />} />
      <Route path="/auth/success" element={<AuthSuccessRoute />} />
      <Route path="/today" element={<TodayRoute />} />
      <Route path="/tasks" element={<TasksRoute />} />
      <Route path="/planner" element={<PlannerRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}

export default App;
