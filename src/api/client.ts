import { environment } from '../config/environment';
import { sessionStorage } from './sessionStorage';
import type { AuthResponse } from './types';

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST';
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
const requests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function refreshSession() {
  refreshInFlight ??= (async () => {
    const response = await fetch(`${environment.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = (await response
      .json()
      .catch(() => ({}))) as Partial<AuthResponse>;
    const token = data.accessToken ?? data.token;
    if (!response.ok || !data.user || !token) {
      setAccessToken(null);
      await sessionStorage.clear();
      return false;
    }
    setAccessToken(token);
    await sessionStorage.writeAccessToken(token);
    return true;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.requiresAuth && accessToken)
    headers.Authorization = `Bearer ${accessToken}`;
  if (__DEV__) console.debug(`[API] ${options.method ?? 'GET'} ${path}`);
  const response = await fetch(`${environment.apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
  };
  if (
    response.status === 401 &&
    options.requiresAuth &&
    options.retryOnUnauthorized !== false
  ) {
    if (await refreshSession()) {
      return performRequest(path, { ...options, retryOnUnauthorized: false });
    }
  }
  if (!response.ok)
    throw new ApiError(
      data.message ?? 'Something went wrong.',
      response.status,
      data.code,
    );
  return data as T;
}

export function request<T>(path: string, options: RequestOptions = {}) {
  const method = options.method ?? 'GET';
  const key = `${method}:${path}:${options.requiresAuth ? (accessToken ?? '') : ''}`;
  const existing = requests.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = performRequest<T>(path, options).finally(() =>
    requests.delete(key),
  );
  requests.set(key, promise);
  return promise;
}
