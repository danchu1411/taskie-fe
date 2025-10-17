import { useState, useEffect } from "react";
import { useAuth } from "../../features/auth/AuthContext";

// Utility function
function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

interface NavigationBarProps {
  onNavigate?: (path: string) => void;
  activeNav?: "today" | "tasks" | "planner" | "stats";
}

export default function NavigationBar({ onNavigate, activeNav = "today" }: NavigationBarProps) {
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      if (onNavigate) onNavigate("/login");
      else if (typeof window !== "undefined") window.location.replace("/login");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (userDropdownOpen && !target.closest('[data-dropdown]')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Close dropdown immediately when activeNav changes (route change)
  useEffect(() => {
    if (userDropdownOpen) {
      setUserDropdownOpen(false);
    }
    // Reset navigating state when route changes
    setIsNavigating(false);
  }, [activeNav]);

  // Close dropdown when component unmounts
  useEffect(() => {
    return () => {
      setUserDropdownOpen(false);
    };
  }, []);
  const navigationItems = [
    { 
      id: "today", 
      label: "Today", 
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      id: "tasks", 
      label: "Tasks", 
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: "planner", 
      label: "Planner", 
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: "stats", 
      label: "Stats", 
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  const handleNavigation = (navId: string) => {
    if (!onNavigate) return;
    
    // Set navigating state and close dropdown immediately
    setIsNavigating(true);
    setUserDropdownOpen(false);
    
    // Reset navigating state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 100);
    
    switch (navId) {
      case "today":
        onNavigate("/today");
        break;
      case "tasks":
        onNavigate("/tasks");
        break;
      case "planner":
        onNavigate("/planner");
        break;
      case "stats":
        onNavigate("/stats");
        break;
    }
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <button
          type="button"
          onClick={() => {
            setIsNavigating(true);
            setUserDropdownOpen(false);
            
            // Reset navigating state after a short delay
            setTimeout(() => {
              setIsNavigating(false);
            }, 100);
            
            onNavigate?.("/today");
          }}
          className="flex items-center"
        >
          <img 
            src="/Logo.png" 
            alt="Taskie" 
            className="h-20 w-auto rounded-full"
          />
        </button>
        
        {/* Navigation Items */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => handleNavigation(nav.id)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
                activeNav === nav.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {nav.icon}
              {nav.label}
            </button>
          ))}
        </nav>
        
        {/* User Profile Dropdown */}
        <div className="flex items-center">
          <div className="relative" data-dropdown>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium transition-all duration-200 ${
                userDropdownOpen 
                  ? 'bg-indigo-700 scale-105 shadow-lg' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
              }`}
            >
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </button>
            
            {/* Dropdown Menu */}
            {userDropdownOpen && !isNavigating && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50 animate-dropdown-in opacity-100 scale-100 translate-y-0 pointer-events-auto">
              <div className="py-1">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-medium text-slate-900">{user?.name || "Guest"}</div>
                    <div className="text-xs text-slate-500">{user?.email || "guest@example.com"}</div>
                  </div>
                  
                  {/* Menu Items */}
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </div>
                  </button>
                  
                  <div className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log out
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
