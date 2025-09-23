export type NetworkErrorCallback = (error: { message: string; originalError: unknown }) => void;

let networkErrorHandler: NetworkErrorCallback | null = null;

export function setNetworkErrorHandler(callback: NetworkErrorCallback | null) {
  networkErrorHandler = callback;
}

export function notifyNetworkError(error: unknown) {
  try {
    if (networkErrorHandler) {
      const message = "Network connection lost. Please check your internet connection and try again.";
      networkErrorHandler({ message, originalError: error });
    }
  } catch (e) {
    // Swallow errors from the handler to avoid breaking the promise chain
    console.error('Network error handler threw error:', e);
  }
}

// Helper function to check if an error is a network error (no response)
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  // Check if it's an axios error without a response
  if ('isAxiosError' in error && error.isAxiosError) {
    return !('response' in error) || error.response === undefined;
  }
  
  // Check for common network error patterns
  if ('code' in error) {
    const code = (error as any).code;
    return code === 'NETWORK_ERROR' || code === 'ECONNABORTED' || code === 'ENOTFOUND';
  }
  
  // Check for fetch API network errors
  if ('name' in error) {
    const name = (error as any).name;
    return name === 'TypeError' && 'message' in error && 
           (error as any).message.includes('fetch');
  }
  
  return false;
}
