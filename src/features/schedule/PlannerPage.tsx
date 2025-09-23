// No default React import needed
import { useAuth } from "../auth/AuthContext";
import { NavigationBar } from "../../components/ui";
import CalendarView from "../../components/ui/CalendarView";

export default function PlannerPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationBar onNavigate={onNavigate} activeNav="planner" />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <CalendarView userId={user?.id || null} />
      </div>
    </div>
  );
}



