import { useEffect } from "react";
import { useAuth } from "./AuthContext";

type AuthSuccessProps = {
  onNavigate?: (path: string) => void;
};

export default function AuthSuccess({ onNavigate }: AuthSuccessProps) {
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.emailVerified) return;
    if (onNavigate) {
      onNavigate("/auth/verify-email");
    } else if (typeof window !== "undefined") {
      window.location.replace("/auth/verify-email");
    }
  }, [isAuthenticated, user?.emailVerified, onNavigate]);

  useEffect(() => {
    if (isAuthenticated) return;
    const fallback = () => {
      if (onNavigate) onNavigate("/login");
      else if (typeof window !== "undefined") window.location.replace("/login");
    };
    fallback();
  }, [isAuthenticated, onNavigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      if (onNavigate) onNavigate("/login");
      else if (typeof window !== "undefined") window.location.replace("/login");
    }
  };

  const goHome = () => {
    if (onNavigate) onNavigate("/");
    else if (typeof window !== "undefined") window.location.replace("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-12 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)]">
        <p className="text-xs uppercase tracking-[0.32em] text-indigo-500">Taskie</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Dang nhap thanh cong!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Chao mung {user?.name ?? user?.email}! Ban da dang nhap thanh cong vao Taskie.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={goHome}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          >
            Ve trang chu
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
          >
            Dang xuat
          </button>
        </div>
      </div>
    </div>
  );
}
