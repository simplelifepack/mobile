import { Dirs, FileSystem } from 'react-native-file-access';
import { environment } from '../config/environment';
import { sessionStorage } from './sessionStorage';
import type { AuthResponse } from './types';
import { uploadMultipart } from '../network/upload';
import { beginActivity } from '../network/activity';
import { networkSnapshot, markServiceReachable } from '../network/connectivity';
import { ResponseCache } from './responseCache';
import {
  cachedPrivateFile,
  cachePrivateFile,
  clearPrivateFileCache,
  prepareDownloadDirectory,
} from './privateFileCache';

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  signal?: AbortSignal;
  dedupeMs?: number;
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
  cacheMs?: number;
  timeoutMs?: number;
  retryTransient?: boolean;
};

let accessToken: string | null = null;
let sessionGeneration = 0;
let accountScope: string | null = null;
export function setAccountScope(id: string | null) {
  if (accountScope === id) return;
  accountScope = id;
  sessionGeneration += 1;
  invalidateReadCaches(true);
}
let unauthorizedHandler: (() => void | Promise<void>) | undefined;
let refreshInFlight: { generation: number; promise: Promise<boolean> } | null =
  null;
export function setUnauthorizedHandler(handler: () => void | Promise<void>) {
  unauthorizedHandler = handler;
}
const requests = new Map<string, Promise<unknown>>();
const responses = new ResponseCache();
const downloads = new Map<string, Promise<DownloadedFile>>();
let cacheRevision = 0;
export function invalidateReadCaches(files = false) {
  cacheRevision += 1;
  responses.clear();
  requests.clear();
  downloads.clear();
  if (files) clearPrivateFileCache().catch(() => undefined);
}

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
  if (accessToken === token) return;
  accessToken = token;
  sessionGeneration += 1;
  invalidateReadCaches(true);
}

async function refreshSession() {
  const generation = sessionGeneration;
  if (refreshInFlight?.generation === generation)
    return refreshInFlight.promise;
  const promise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let response;
    let data: Partial<AuthResponse>;
    try {
      response = await fetch(`${environment.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      });
      data = (await response.json().catch(() => ({}))) as Partial<AuthResponse>;
    } finally {
      clearTimeout(timer);
    }
    if (generation !== sessionGeneration) return false;
    if (response.status >= 500 || response.status === 429)
      throw new ApiError(
        'The sign-in service is temporarily unavailable. Your session has been kept.',
        response.status,
      );
    const token = data.accessToken ?? data.token;
    if (
      !response.ok ||
      !data.user ||
      !token ||
      (accountScope !== null && data.user.id !== accountScope)
    ) {
      setAccessToken(null);
      await sessionStorage.clear();
      await unauthorizedHandler?.();
      return false;
    }
    accessToken = token;
    await sessionStorage.writeAccessToken(token);
    return generation === sessionGeneration;
  })().finally(() => {
    if (refreshInFlight?.generation === generation) refreshInFlight = null;
  });
  refreshInFlight = { generation, promise };
  return promise;
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const generation = sessionGeneration;
  if (networkSnapshot().offline)
    throw new ApiError('Your device is offline.', 0, 'OFFLINE');
  if (!path.startsWith('/') || path.startsWith('//'))
    throw new ApiError('Invalid API path.', 400);
  const multipart =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = multipart
    ? {}
    : { 'Content-Type': 'application/json' };
  if (options.requiresAuth && accessToken)
    headers.Authorization = `Bearer ${accessToken}`;
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(
    () => {
      timedOut = true;
      controller.abort();
    },
    options.timeoutMs ??
      (multipart
        ? 180000
        : (options.method ?? 'GET') === 'GET'
          ? 30000
          : 60000),
  );
  const activity = beginActivity(
    multipart ? 'Uploading encrypted files' : 'Loading records',
    multipart ? 'upload' : 'download',
  );
  let response;
  let data: { message?: string; code?: string };
  try {
    response =
      multipart && (options.method ?? 'GET') === 'POST'
        ? await uploadMultipart(
            `${environment.apiUrl}${path}`,
            headers,
            options.body as FormData,
            controller.signal,
            activity.progress,
          )
        : await fetch(`${environment.apiUrl}${path}`, {
            method: options.method ?? 'GET',
            headers,
            body:
              options.body === undefined
                ? undefined
                : multipart
                  ? (options.body as FormData)
                  : JSON.stringify(options.body),
            signal: controller.signal,
            credentials: 'include',
          });
    if (response.status > 0) markServiceReachable();
    if (options.requiresAuth && generation !== sessionGeneration)
      throw new ApiError('Session changed. Please retry.', 401);
    data = (await response.json().catch(error => {
      if (controller.signal.aborted) throw error;
      return {};
    })) as { message?: string; code?: string };
  } catch (error) {
    if (options.requiresAuth && generation !== sessionGeneration)
      throw new ApiError('Session changed. Please retry.', 401);
    if (timedOut)
      throw new ApiError(
        'This request took too long. Check your connection and try again.',
        408,
      );
    throw error;
  } finally {
    activity.end();
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
  if (options.requiresAuth && generation !== sessionGeneration)
    throw new ApiError('Session changed. Please retry.', 401);
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
      (data.code === 'STORAGE_LIMIT_EXCEEDED'
        ? 'Cloud storage full. Delete documents to free space or upgrade for unlimited cloud storage.'
        : data.code === 'AI_MONTHLY_LIMIT_EXCEEDED'
          ? 'You have used your AI package search allowance this month. Your allowance resets next month (UTC).'
          : data.message) ??
        (response.status === 404
          ? 'This feature is unavailable on the connected server.'
          : 'Something went wrong.'),
      response.status,
      data.code,
    );
  if ((options.method ?? 'GET') !== 'GET')
    invalidateReadCaches(
      path.startsWith('/documents') && path !== '/documents/analyze',
    );
  return data as T;
}

/** Retry only opted-in reads once; cancellation and authentication failures are final. */
async function performRead<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const generation = sessionGeneration;
  try {
    return await performRequest<T>(path, options);
  } catch (error) {
    const transient =
      error instanceof ApiError
        ? [408, 502, 503, 504].includes(error.status)
        : error instanceof TypeError;
    if (
      !options.retryTransient ||
      !transient ||
      options.signal?.aborted ||
      generation !== sessionGeneration
    )
      throw error;
    await new Promise<void>((resolve, reject) => {
      const cancelled = () => {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', cancelled);
        reject(
          Object.assign(new Error('Request cancelled.'), {
            name: 'AbortError',
          }),
        );
      };
      const timer = setTimeout(() => {
        options.signal?.removeEventListener('abort', cancelled);
        resolve();
      }, 500);
      options.signal?.addEventListener('abort', cancelled, { once: true });
      if (options.signal?.aborted) cancelled();
    });
    if (generation !== sessionGeneration)
      throw new ApiError('Session changed. Please retry.', 401);
    return performRequest<T>(path, options);
  }
}

export function request<T>(path: string, options: RequestOptions = {}) {
  const method = options.method ?? 'GET';
  const key = `${sessionGeneration}:${method}:${path}:${options.requiresAuth ? (accessToken ?? '') : ''}`;
  if (method !== 'GET') return performRequest<T>(path, options);
  if (options.signal?.aborted)
    return Promise.reject(
      Object.assign(new Error('Request cancelled.'), { name: 'AbortError' }),
    );
  const cacheMs = options.cacheMs ?? options.dedupeMs ?? 0;
  if (cacheMs) {
    const cached = responses.get<T>(key);
    if (cached !== undefined) return Promise.resolve(cached);
  }
  if (networkSnapshot().offline || networkSnapshot().unreachable) {
    const cached = responses.get<T>(key, true);
    if (cached !== undefined) return Promise.resolve(cached);
    if (networkSnapshot().offline)
      return Promise.reject(
        new ApiError('Your device is offline.', 0, 'OFFLINE'),
      );
  }
  const existing = options.signal
    ? undefined
    : (requests.get(key) as Promise<T> | undefined);
  if (existing) return existing;
  const revision = cacheRevision;
  const promise = performRead<T>(path, options)
    .then(value => {
      if (options.cacheMs && revision === cacheRevision)
        responses.set(key, value, options.cacheMs);
      return value;
    })
    .finally(() => {
      if (requests.get(key) === promise) requests.delete(key);
    });
  if (!options.signal) requests.set(key, promise);
  return promise;
}

export type DownloadedFile = {
  path: string;
  fileName: string;
  mimeType: string;
};
/** Streams private downloads to app cache instead of materializing PDF/ZIP bytes in JS. */
export async function downloadFile(
  path: string,
  options: RequestOptions = {},
): Promise<DownloadedFile> {
  const generation = sessionGeneration;
  const revision = cacheRevision;
  const key = `${generation}:${path}`;
  const reusable =
    (options.method ?? 'GET') === 'GET' &&
    Boolean(options.cacheMs) &&
    !options.signal;
  if (reusable) {
    const cached = await cachedPrivateFile(
      key,
      networkSnapshot().offline || networkSnapshot().unreachable,
    );
    if (generation !== sessionGeneration)
      throw new ApiError('Session changed. Please retry.', 401);
    if (cached && revision === cacheRevision) return cached;
    const existing = downloads.get(key);
    if (existing) return existing;
  }
  const work = streamDownload(path, options)
    .then(async file => {
      if (
        reusable &&
        generation === sessionGeneration &&
        revision === cacheRevision
      )
        await cachePrivateFile(key, file).catch(() => undefined);
      if (options.requiresAuth && generation !== sessionGeneration) {
        await FileSystem.unlink(file.path).catch(() => undefined);
        throw new ApiError('Session changed. Please retry.', 401);
      }
      return file;
    })
    .finally(() => {
      if (downloads.get(key) === work) downloads.delete(key);
    });
  if (reusable) downloads.set(key, work);
  return work;
}
async function streamDownload(
  path: string,
  options: RequestOptions,
): Promise<DownloadedFile> {
  if (!path.startsWith('/') || path.startsWith('//'))
    throw new ApiError('Invalid API path.', 400);
  const generation = sessionGeneration;
  const directory = `${Dirs.CacheDir}/readines-preview`;
  await prepareDownloadDirectory();
  const temporaryPath = `${directory}/${Date.now()}-${Math.random().toString(36).slice(2)}.download`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.requiresAuth && accessToken)
    headers.Authorization = `Bearer ${accessToken}`;
  if (networkSnapshot().offline)
    throw new ApiError(
      'This file is not downloaded on this device. Reconnect to download it.',
      0,
      'OFFLINE',
    );
  const activity = beginActivity();
  try {
    const transfer = FileSystem.fetchManaged(
      `${environment.apiUrl}${path}`,
      {
        method: options.method ?? 'GET',
        headers,
        path: temporaryPath,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      },
      (received, total) => activity.progress(received, total),
    );
    const abort = () => {
      void transfer.cancel().catch(() => undefined);
    };
    if ((options.method ?? 'GET') === 'GET') activity.setCancel(abort);
    const timer = setTimeout(abort, options.timeoutMs ?? 120000);
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    let response;
    try {
      response = await transfer.result;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
    if (options.requiresAuth && generation !== sessionGeneration)
      throw new ApiError('Session changed. Please retry.', 401);
    if (
      response.status === 401 &&
      options.requiresAuth &&
      options.retryOnUnauthorized !== false &&
      (await refreshSession())
    ) {
      if (await FileSystem.exists(temporaryPath))
        await FileSystem.unlink(temporaryPath);
      return streamDownload(path, { ...options, retryOnUnauthorized: false });
    }
    if (!response.ok) {
      let message = 'Unable to download this file.';
      try {
        const body = JSON.parse(
          await FileSystem.readFileChunk(temporaryPath, 0, 8192, 'utf8'),
        );
        message = body.message ?? message;
      } catch {
        /* Keep the safe fallback for non-JSON error responses. */
      }
      throw new ApiError(message, response.status);
    }
    const encodedName =
      response
        .getHeader('Content-Disposition')
        ?.match(/filename="?([^";]+)/)?.[1] ?? 'readines-download';
    let fileName = encodedName;
    try {
      fileName = decodeURIComponent(encodedName);
    } catch {
      /* The server can return an unencoded filename. */
    }
    const destination = `${temporaryPath.slice(0, -9)}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await FileSystem.mv(temporaryPath, destination);
    return {
      path: destination,
      fileName,
      mimeType:
        response.getHeader('Content-Type')?.split(';')[0] ??
        'application/octet-stream',
    };
  } catch (error) {
    if (await FileSystem.exists(temporaryPath))
      await FileSystem.unlink(temporaryPath).catch(() => undefined);
    throw error;
  } finally {
    activity.end();
  }
}
