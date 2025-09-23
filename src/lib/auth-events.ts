export type UnauthorizedCallback = (error: unknown) => Promise<boolean> | boolean;

let unauthorizedHandler: UnauthorizedCallback | null = null;

export function setUnauthorizedHandler(callback: UnauthorizedCallback | null) {
  unauthorizedHandler = callback;
}

export async function notifyUnauthorized(error: unknown): Promise<boolean> {
  if (!unauthorizedHandler) {
    return false;
  }

  try {
    const result = await unauthorizedHandler(error);
    return Boolean(result);
  } catch (e) {
    // Log errors from the handler but still resolve false
    console.error('Unauthorized handler threw error:', e);
    return false;
  }
}


