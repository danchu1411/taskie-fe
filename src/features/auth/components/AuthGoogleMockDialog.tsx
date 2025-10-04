import { useState } from "react";

export type AuthGoogleMockDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; name: string; remember: boolean }) => void;
  loading: boolean;
  error: string | null;
};

/**
 * Mock Google authentication dialog for development
 * 
 * Provides a simple form for entering mock user data when VITE_GOOGLE_ALLOW_MOCK=true
 */
export function AuthGoogleMockDialog({ 
  open, 
  onClose, 
  onSubmit, 
  loading, 
  error 
}: AuthGoogleMockDialogProps) {
  const [formData, setFormData] = useState({ email: "", name: "", remember: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) {
      return;
    }
    onSubmit({
      email: formData.email.trim(),
      name: formData.name.trim(),
      remember: formData.remember
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Mock Google Login</h3>
        <p className="mt-2 text-sm text-slate-500">
          Enter mock user details for development testing.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="mock-email" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="mock-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              placeholder="mockuser@example.com"
            />
          </div>
          <div>
            <label htmlFor="mock-name" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="mock-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              placeholder="Mock User"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="mock-remember"
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => setFormData(prev => ({ ...prev, remember: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            <label htmlFor="mock-remember" className="text-sm text-slate-600">
              Remember me
            </label>
          </div>
          {error && (
            <p className="text-xs text-rose-600">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Mock Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
