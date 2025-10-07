// No default React import needed
import { useEffect, lazy, Suspense } from "react";
import { useAuth } from "../auth/AuthContext";
import { useAuthNavigation } from "../auth/hooks";
import { NavigationBar } from "../../components/ui";
const CalendarView = lazy(() => import("../../components/ui/CalendarView"));
import AuthLoadingOverlay from "../auth/AuthLoadingOverlay";

export default function PlannerPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user, status, isAuthenticated } = useAuth();
  const navigate = useAuthNavigation(onNavigate);

  // Redirect to login if the page requires authentication and the user is not authenticated
  useEffect(() => {
    if (status !== "authenticating" && !isAuthenticated) {
      navigate("/login");
    }
  }, [status, isAuthenticated, navigate]);
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthLoadingOverlay show={status === "authenticating"} label="Đang xác thực..." />
      <NavigationBar onNavigate={onNavigate} activeNav="planner" />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Suspense
          fallback={
            <div className="flex h-96 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
                </span>
                <span>Đang tải lịch...</span>
              </div>
            </div>
          }
        >
          <CalendarView userId={user?.id || null} />
        </Suspense>
      </div>
    </div>
  );
}



