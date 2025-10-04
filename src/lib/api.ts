import axios from "axios";
import { notifyUnauthorized } from "./auth-events";
import { notifyNetworkError, isNetworkError } from "./network-events";

type MaybeString = string | null | undefined;

// Extend AxiosRequestConfig to include our custom properties
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

const baseURL = (import.meta.env.VITE_API_BASE as MaybeString) ?? "/api";

const api = axios.create({
  baseURL,
});

const envAccessToken = (import.meta.env.VITE_ACCESS_TOKEN as MaybeString) ?? null;
const envDevUserId = (import.meta.env.VITE_DEV_USER_ID as MaybeString) ?? null;

let runtimeAccessToken: string | null = null;
let runtimeRefreshToken: string | null = null;
let runtimeDevUserId: string | null = null;

export function setRuntimeAccessToken(token: MaybeString) {
  runtimeAccessToken = token ?? null;
}

export function setRuntimeRefreshToken(token: MaybeString) {
  runtimeRefreshToken = token ?? null;
}

export function setRuntimeDevUserId(userId: MaybeString) {
  runtimeDevUserId = userId ?? null;
}

export function getAccessToken() {
  return runtimeAccessToken ?? envAccessToken ?? null;
}

export function getRefreshToken() {
  return runtimeRefreshToken ?? null;
}

export function getDevUserId() {
  return runtimeDevUserId ?? envDevUserId ?? null;
}

export function clearRuntimeAuth() {
  runtimeAccessToken = null;
  runtimeRefreshToken = null;
  runtimeDevUserId = null;
}

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  delete (config.headers as Record<string, unknown>).Authorization;
  delete (config.headers as Record<string, unknown>)["x-user-id"];

  const token = getAccessToken();
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    return config;
  }

  const devUserId = getDevUserId();
  if (devUserId) {
    (config.headers as Record<string, string>)["x-user-id"] = devUserId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (no response)
    if (isNetworkError(error)) {
      notifyNetworkError(error);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized with automatic refresh
    if (error && error.response && error.response.status === 401) {
      // Guard against infinite loops
      if (originalRequest?.skipAuthRefresh || originalRequest?._retry) {
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the session
        const recovered = await notifyUnauthorized(error);
        
        if (recovered && originalRequest) {
          // Clone the original request and mark it as retried
          const retryConfig = {
            ...originalRequest,
            _retry: true,
          };
          
          // Retry the request with the updated token
          return api(retryConfig);
        }
      } catch (refreshError) {
        console.warn('Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
