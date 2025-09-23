import axios from "axios";
import { notifyUnauthorized } from "./auth-events";
import { notifyNetworkError, isNetworkError } from "./network-events";

type MaybeString = string | null | undefined;

const baseURL = (import.meta.env.VITE_API_BASE as MaybeString) ?? "/api";

const api = axios.create({
  baseURL,
});

const envAccessToken = (import.meta.env.VITE_ACCESS_TOKEN as MaybeString) ?? null;
const envDevUserId = (import.meta.env.VITE_DEV_USER_ID as MaybeString) ?? null;

let runtimeAccessToken: string | null = null;
let runtimeDevUserId: string | null = null;

export function setRuntimeAccessToken(token: MaybeString) {
  runtimeAccessToken = token ?? null;
}

export function setRuntimeDevUserId(userId: MaybeString) {
  runtimeDevUserId = userId ?? null;
}

export function getAccessToken() {
  return runtimeAccessToken ?? envAccessToken ?? null;
}

export function getDevUserId() {
  return runtimeDevUserId ?? envDevUserId ?? null;
}

export function clearRuntimeAuth() {
  runtimeAccessToken = null;
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
  (error) => {
    // Handle network errors (no response)
    if (isNetworkError(error)) {
      notifyNetworkError(error);
    }
    // Normalize 401 to a consistent shape and allow upper layers to handle
    else if (error && error.response && error.response.status === 401) {
      notifyUnauthorized(error);
    }
    return Promise.reject(error);
  }
);

export default api;
