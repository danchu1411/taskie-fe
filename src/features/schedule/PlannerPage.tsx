// No default React import needed
import { useEffect, lazy, Suspense } from "react";
import { useAuth } from "../auth/AuthContext";
import { useAuthNavigation } from "../auth/hooks";
import { NavigationBar } from "../../components/ui";
import { WallpaperBackground } from "../../components/WallpaperBackground";
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
    <WallpaperBackground
      imagePath="/images/wallpapers/wallpaper-planner-desktop.jpg"
      mobileImagePath="/images/wallpapers/wallpaper-planner-mobile.jpg"
      className="min-h-screen"
      overlay={true}
      floatingElements={false}
    >
      <AuthLoadingOverlay show={status === "authenticating"} label="Đang xác thực..." />
      <NavigationBar onNavigate={onNavigate} activeNav="planner" />
      
      
      <div className="mx-auto max-w-7xl px-6 py-6">
        <Suspense
          fallback={
            <div className="flex h-96 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 text-white/80">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 animate-spin rounded-full border-[3px] border-white/50 border-t-transparent" />
                </span>
                <span>Loading schedule...</span>
              </div>
            </div>
          }
        >
          <CalendarView userId={user?.id || null} />
        </Suspense>
      </div>
    </WallpaperBackground>
  );
}



