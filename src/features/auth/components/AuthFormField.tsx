import { type ReactNode } from "react";

export type AuthFormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
};

/**
 * Form field wrapper with consistent label styling
 * 
 * Provides standardized label + input styling for authentication forms
 */
export function AuthFormField({ id, label, children }: AuthFormFieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
