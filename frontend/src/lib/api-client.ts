/**
 * Thin typed fetch wrapper for the ApoxylTech Phase 1 API.
 *
 * - Sends the access token as a Bearer header (kept in memory, not
 *   localStorage — matches the backend's cookie-only refresh token model).
 * - Automatically retries once with a refreshed access token on a 401,
 *   since the refresh token lives in an HttpOnly cookie the browser sends
 *   automatically to /api/auth/refresh.
 */
import type { ApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

let inMemoryAccessToken: string | null = null;
let inFlightRefresh: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

class ApiClientError extends Error {
  status: number;
  body: ApiError | null;

  constructor(status: number, body: ApiError | null, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const headers = new Headers(options.headers);
  if (inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // sends the HttpOnly refresh cookie
  });

  if (response.status === 401 && !_retried && path !== "/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
  }

  if (!response.ok) {
    let body: ApiError | null = null;
    try {
      body = await response.json();
    } catch {
      // no JSON body
    }
    throw new ApiClientError(
      response.status,
      body,
      body?.error?.message ?? `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  // Multiple requests can 401 at the same instant (e.g. a page that fires
  // several fetches on load). Without sharing one in-flight refresh, each
  // would call /auth/refresh independently — and since the backend rotates
  // refresh tokens (each call invalidates the previous one), only the first
  // of several simultaneous calls would succeed; the rest would fail even
  // though the session is actually fine. Sharing one promise means every
  // caller waits for and reuses the same single refresh attempt.
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return false;
        const data = await res.json();
        setAccessToken(data.access_token);
        return true;
      } catch {
        return false;
      } finally {
        inFlightRefresh = null;
      }
    })();
  }
  return inFlightRefresh;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export { ApiClientError };