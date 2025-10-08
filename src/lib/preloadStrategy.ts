/**
 * Preload Strategy for Performance Optimization
 * Tự động preload các resources quan trọng
 */

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical CSS
  preloadResource('/src/index.css', 'style');
  
  // Preload critical fonts
  preloadResource('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', 'style');
  
  // Preload critical images
  preloadResource('/taskie.svg', 'image');
}

// Preload page-specific resources
export function preloadPageResources(page: 'today' | 'tasks' | 'planner') {
  if (typeof window === 'undefined') return;

  switch (page) {
    case 'today':
      // Preload Today page specific resources
      preloadResource('/src/features/schedule/TodayPage.tsx', 'script');
      preloadResource('/src/components/optimized/TodayTaskCard.tsx', 'script');
      break;
      
    case 'tasks':
      // Preload Tasks page specific resources
      preloadResource('/src/features/tasks/TasksPage.tsx', 'script');
      preloadResource('/src/components/ui/BoardView.tsx', 'script');
      break;
      
    case 'planner':
      // Preload Planner page specific resources
      preloadResource('/src/features/schedule/PlannerPage.tsx', 'script');
      preloadResource('/src/components/ui/CalendarView.tsx', 'script');
      break;
  }
}

// Preload component resources
export function preloadComponentResources(component: string) {
  if (typeof window === 'undefined') return;

  const componentMap: Record<string, string> = {
    'TaskModal': '/src/components/ui/TaskModal.tsx',
    'ScheduleModal': '/src/components/ui/ScheduleModal.tsx',
    'CalendarView': '/src/components/ui/CalendarView.tsx',
    'FocusTimer': '/src/features/schedule/components/FocusTimerFullscreen.tsx',
  };

  const resource = componentMap[component];
  if (resource) {
    preloadResource(resource, 'script');
  }
}

// Preload API data
export function preloadAPIData(userId: string) {
  if (typeof window === 'undefined') return;

  // Prefetch critical API endpoints
  const criticalEndpoints = [
    `/api/tasks/by-user/${userId}`,
    `/api/schedule-entries/upcoming`,
  ];

  criticalEndpoints.forEach(endpoint => {
    // Use link prefetch for API data
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });
}

// Generic preload function
function preloadResource(href: string, as: 'script' | 'style' | 'image' | 'font') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

// Preload on hover
export function preloadOnHover(element: HTMLElement, resource: string, type: 'script' | 'style' | 'image') {
  let preloaded = false;
  
  const preload = () => {
    if (!preloaded) {
      preloadResource(resource, type);
      preloaded = true;
    }
  };
  
  element.addEventListener('mouseenter', preload, { once: true });
  element.addEventListener('focus', preload, { once: true });
}

// Preload on intersection
export function preloadOnIntersection(element: HTMLElement, resource: string, type: 'script' | 'style' | 'image') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        preloadResource(resource, type);
        observer.unobserve(element);
      }
    });
  });
  
  observer.observe(element);
}
