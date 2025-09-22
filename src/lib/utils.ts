// Utility functions used across the application

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function statusLabel(value: number): string {
  switch (value) {
    case 0: return "Planned";
    case 1: return "In Progress";
    case 2: return "Done";
    case 3: return "Skipped";
    default: return "Unknown";
  }
}

export function priorityLabel(value: number | null): string {
  switch (value) {
    case 1: return "Must";
    case 2: return "Should";
    case 3: return "Want";
    default: return "None";
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `In ${diffDays}d`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function cycleStatus(currentStatus: number): number {
  return ((currentStatus + 1) % 4);
}

// Extract a human-friendly error message from various error shapes
export function getErrorMessage(error: unknown): string {
  // Axios error with response message or error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as any;
    const data = axiosErr.response?.data;
    const code = data?.code || data?.error || data?.message;
    if (typeof code === 'string' && code.trim().length > 0) return code;
    const statusText = axiosErr.response?.statusText;
    if (typeof statusText === 'string' && statusText.trim().length > 0) return statusText;
  }
  // Generic Error
  if (error instanceof Error && error.message) return error.message;
  // Fallback
  return 'Something went wrong. Please try again.';
}

