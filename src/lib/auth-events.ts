export type UnauthorizedCallback = (error: unknown) => void;

let unauthorizedHandler: UnauthorizedCallback | null = null;

export function setUnauthorizedHandler(callback: UnauthorizedCallback | null) {
  unauthorizedHandler = callback;
}

export function notifyUnauthorized(error: unknown) {
  try {
    if (unauthorizedHandler) unauthorizedHandler(error);
  } catch (e) {
    // Swallow errors from the handler to avoid breaking the promise chain
    console.error('Unauthorized handler threw error:', e);
  }
}


