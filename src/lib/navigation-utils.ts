// Navigation utility for API interceptors
let navigateFunction: ((path: string) => void) | null = null;

export function setNavigateFunction(navigate: (path: string) => void) {
  navigateFunction = navigate;
}

export function navigateTo(path: string) {
  if (navigateFunction) {
    navigateFunction(path);
  } else {
    // Fallback to window.location for SSR compatibility
    window.location.href = path;
  }
}
