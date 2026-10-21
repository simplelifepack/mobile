import { environment } from '../config/environment';
import { sessionStorage } from './sessionStorage';
import { FileSystem } from 'react-native-file-access';
import type { AuthResponse } from './types';

type RequestOptions = {
  body?: unknown;
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST';
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

export type MultipartFile = {
  fieldName: string;
  uri: string;
  name: string;
  mimeType: string;
};

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
const requests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly errorId?: string,
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
    errorId?: string;
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
      data.errorId,
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

export async function uploadMultipart<T>(
  path: string,
  fields: Record<string, string>,
  files: MultipartFile[],
): Promise<T> {
  const upload = async (retryOnUnauthorized: boolean): Promise<T> => {
    const formData = new FormData();
    Object.entries(fields).forEach(([name, value]) => {
      formData.append(name, value);
    });
    files.forEach(file => {
      formData.append(
        file.fieldName,
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as unknown as Blob,
      );
    });

    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (__DEV__) console.debug(`[API] POST ${path} (multipart)`);

    const response = await fetch(`${environment.apiUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
      errorId?: string;
    };

    if (response.status === 401 && retryOnUnauthorized && (await refreshSession())) {
      return upload(false);
    }
    if (!response.ok) {
      throw new ApiError(
        data.message ?? 'Something went wrong.',
        response.status,
        data.code,
        data.errorId,
      );
    }
    return data as T;
  };

  return upload(true);
}

export async function downloadToFile(path: string, destination: string) {
  const download = async (retryOnUnauthorized: boolean): Promise<{
    path: string;
    fileName: string;
  }> => {
    if (await FileSystem.exists(destination)) {
      await FileSystem.unlink(destination);
    }

    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    let response;
    try {
      response = await FileSystem.fetch(
        `${environment.apiUrl}${path}`,
        { method: 'GET', headers, path: destination },
      );
    } catch (error) {
      await FileSystem.unlink(destination).catch(() => undefined);
      throw error;
    }

    if (
      response.status === 401 &&
      retryOnUnauthorized &&
      (await refreshSession())
    ) {
      return download(false);
    }

    if (!response.ok) {
      const body = await FileSystem.readFile(destination).catch(() => '');
      await FileSystem.unlink(destination).catch(() => undefined);
      let data: { message?: string; code?: string; errorId?: string } = {};
      try {
        data = JSON.parse(body) as typeof data;
      } catch {
        data.message = 'Download failed.';
      }
      throw new ApiError(
        data.message ?? 'Download failed.',
        response.status,
        data.code,
        data.errorId,
      );
    }

    const disposition = response.getHeader('Content-Disposition') ?? '';
    const rawFileName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const fileName = rawFileName?.replace(/[\\/]/g, '_') || 'download.zip';
    return { path: destination, fileName };
  };

  return download(true);
}
