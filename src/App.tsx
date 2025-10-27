import { useCallback, useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import { SystemError } from "./components/ui";
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
import { StudyProfileQuiz } from "./features/study-profile/StudyProfileQuiz";
import { setNavigateFunction } from "./lib/navigation-utils";
import { SettingsPage } from "./features/settings/SettingsPage";
import { SubscriptionPage } from "./features/payment/SubscriptionPage";
import { AISuggestionsPage } from "./features/ai-suggestions/AISuggestionsPage";
import StatsPage from "./features/stats/StatsPage";

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
  
  // NEW: Check study profile
  if (auth.user?.hasStudyProfile === false) {
    return "/study-profile/quiz";
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

function VerifyEmailRedirectRoute() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  
  if (token && token.length > 10) { // Basic token validation
    return <Navigate to={`/auth/verify-email?token=${token}`} replace />;
  }
  
  // If no token, redirect to signup page
  return <Navigate to="/signup" replace />;
}

function VerifyEmailRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  // Allow access to verify page even without auth (for email links)
  // Only redirect if already verified
  if (auth.user?.emailVerified) {
    return <Navigate to="/today" replace />;
  }

  return <VerifyEmail onNavigate={navigate} />;
}

function AuthSuccessRoute() {
  const navigate = useNavigationHandler();

  return (
    <RequireAuthRoute allowUnverified={true}>
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

function StudyProfileQuizRoute() {
  const navigate = useNavigationHandler();
  
  return (
    <RequireAuthRoute allowUnverified={true}>
      <StudyProfileQuiz onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function SettingsRoute() {
  const navigate = useNavigationHandler();
  
  return (
    <RequireAuthRoute>
      <SettingsPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function SubscriptionRoute() {
  const navigate = useNavigationHandler();
  
  return (
    <RequireAuthRoute>
      <SubscriptionPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function AISuggestionsRoute() {
  const navigate = useNavigationHandler();
  
  return (
    <RequireAuthRoute>
      <AISuggestionsPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function StatsRoute() {
  const navigate = useNavigationHandler();
  
  return (
    <RequireAuthRoute>
      <StatsPage onNavigate={navigate} />
    </RequireAuthRoute>
  );
}

function ErrorRoute() {
  const auth = useAuth();
  const navigate = useNavigationHandler();

  // If there's no error, redirect appropriately
  if (!auth.authError && !auth.networkError) {
    if (auth.isAuthenticated) {
      return <Navigate to={resolveAuthenticatedDestination(auth)} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Determine error type and message
  const isNetworkError = Boolean(auth.networkError);
  const errorTitle = isNetworkError ? "Network Error" : "Authentication Error";
  const errorMessage = auth.networkError || auth.authError || "An unexpected error occurred";

  const handleRetry = () => {
    if (isNetworkError) {
      auth.clearNetworkError();
    } else {
      auth.clearAuthError();
    }
    // Try to refresh the current page or go to a safe default
    if (auth.isAuthenticated) {
      navigate('/today');
    } else {
      navigate('/');
    }
  };

  const handleLogin = () => {
    if (isNetworkError) {
      auth.clearNetworkError();
    } else {
      auth.clearAuthError();
    }
    navigate('/login');
  };

  return (
    <SystemError
      fullScreen
      variant="error"
      title={errorTitle}
      message={errorMessage}
      actions={[
        {
          label: isNetworkError ? 'Retry' : 'Log in again',
          onClick: isNetworkError ? handleRetry : handleLogin,
          variant: 'primary'
        },
        {
          label: 'Go Home',
          onClick: () => {
            if (isNetworkError) {
              auth.clearNetworkError();
            } else {
              auth.clearAuthError();
            }
            navigate('/');
          },
          variant: 'secondary'
        }
      ]}
    />
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
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Setup navigation function for API interceptors
  useEffect(() => {
    setNavigateFunction(navigate);
  }, [navigate]);

  // Redirect to error route when auth or network error occurs
  useEffect(() => {
    if ((auth.authError || auth.networkError) && location.pathname !== '/error') {
      navigate('/error', { replace: true });
    }
  }, [auth.authError, auth.networkError, navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
      <Route path="/reset-password" element={<ResetPasswordRoute />} />
      <Route path="/verify-email" element={<VerifyEmailRedirectRoute />} />
      <Route path="/auth/verify-email" element={<VerifyEmailRoute />} />
      <Route path="/auth/success" element={<AuthSuccessRoute />} />
      <Route path="/error" element={<ErrorRoute />} />
      <Route path="/study-profile/quiz" element={<StudyProfileQuizRoute />} />
      <Route path="/settings" element={<SettingsRoute />} />
      <Route path="/subscription" element={<SubscriptionRoute />} />
      <Route path="/ai-suggestions" element={<AISuggestionsRoute />} />
      <Route path="/today" element={<TodayRoute />} />
      <Route path="/tasks" element={<TasksRoute />} />
      <Route path="/planner" element={<PlannerRoute />} />
      <Route path="/stats" element={<StatsRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}

export default App;
