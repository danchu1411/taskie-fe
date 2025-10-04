import { type ReactNode } from "react";

export type AuthCheckboxRowProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  link?: {
    href: string;
    text: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
};

/**
 * Checkbox row with label and optional link
 * 
 * Provides consistent styling for checkbox + label + link combinations
 * commonly used in authentication forms (remember me, terms agreement, etc.)
 */
export function AuthCheckboxRow({ 
  id, 
  checked, 
  onChange, 
  disabled = false, 
  label, 
  link 
}: AuthCheckboxRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm text-slate-500">
      <label className="inline-flex items-center gap-2 text-slate-600">
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {link && (
        <a
          href={link.href}
          onClick={link.onClick}
          className="text-slate-600 underline underline-offset-4 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
        >
          {link.text}
        </a>
      )}
    </div>
  );
}
