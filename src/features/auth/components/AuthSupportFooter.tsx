import { type ReactNode } from "react";

export type AuthSupportFooterProps = {
  children?: ReactNode;
  showContact?: boolean;
};

/**
 * Support footer component for authentication pages
 * 
 * Provides consistent contact support section with optional custom content
 */
export function AuthSupportFooter({ children, showContact = true }: AuthSupportFooterProps) {
  return (
    <div className="mt-8 border-t border-slate-200/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[11px] text-slate-500 md:px-10">
        <div>&copy; {new Date().getFullYear()} Taskie</div>
        <div className="flex gap-6">
          {showContact && (
            <a 
              href="mailto:support@taskie.dev" 
              className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
            >
              Contact support
            </a>
          )}
          <a 
            href="#terms" 
            className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          >
            Terms
          </a>
          <a 
            href="#privacy" 
            className="transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          >
            Privacy
          </a>
        </div>
      </div>
      {children && (
        <div className="mx-auto max-w-6xl px-6 pb-6 md:px-10">
          {children}
        </div>
      )}
    </div>
  );
}
