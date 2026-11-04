import { uploadMultipart } from '../network/upload';
jest.mock('../network/upload', () => ({ uploadMultipart: jest.fn() }));
import { FileSystem } from 'react-native-file-access';
import {
  request,
  setAccessToken,
  downloadFile,
  invalidateReadCaches,
  setAccountScope,
} from './client';
import { sessionStorage } from './sessionStorage';
jest.mock('./sessionStorage', () => ({
  sessionStorage: { clear: jest.fn(), writeAccessToken: jest.fn() },
}));
const response = (data: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
  headers: { get: () => null },
});
const fetchMock = jest.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
  setAccountScope(null);
  setAccessToken('token-a');
});

it('rejects a refresh cookie for a different signed-in account', async () => {
  setAccountScope('account-a');
  fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(
    response({
      token: 'account-b-token',
      user: { id: 'account-b', name: 'B', email: 'b@example.test' },
    }),
  );
  await expect(
    request('/private', { requiresAuth: true }),
  ).rejects.toMatchObject({ status: 401 });
  expect(sessionStorage.clear).toHaveBeenCalled();
  fetchMock.mockResolvedValue(response({}));
  await request('/auth/me', { requiresAuth: true });
  expect(fetchMock.mock.calls.at(-1)![1].headers.Authorization).toBeUndefined();
});
it('deduplicates concurrent reads but preserves independent writes and bodies', async () => {
  let release!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  const first = request('/documents', { requiresAuth: true });
  const second = request('/documents', { requiresAuth: true });
  expect(first).toBe(second);
  release(response([]));
  await first;
  fetchMock.mockResolvedValue(response({}));
  await Promise.all([
    request('/api/wealth/records', {
      method: 'POST',
      requiresAuth: true,
      body: { title: 'A' },
    }),
    request('/api/wealth/records', {
      method: 'POST',
      requiresAuth: true,
      body: { title: 'B' },
    }),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ title: 'A' });
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ title: 'B' });
});
it('refreshes one time and retries with the new bearer token', async () => {
  fetchMock
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(
      response({
        accessToken: 'token-b',
        user: { name: 'User', email: 'user@example.test' },
      }),
    )
    .mockResolvedValueOnce(response({ ok: true }));
  await expect(request('/auth/me', { requiresAuth: true })).resolves.toEqual({
    ok: true,
  });
  expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
    'Bearer token-b',
  );
  expect(sessionStorage.writeAccessToken).toHaveBeenCalledWith('token-b');
});
it('omits JSON headers for native multipart uploads', async () => {
  jest.mocked(uploadMultipart).mockResolvedValue(response({}));
  const body = new FormData();
  body.append('envelopes', '[]');
  await request('/documents/analyze', {
    method: 'POST',
    body,
    requiresAuth: true,
  });
  expect(jest.mocked(uploadMultipart).mock.calls[0][2]).toBe(body);
  expect(
    jest.mocked(uploadMultipart).mock.calls[0][1]['Content-Type'],
  ).toBeUndefined();
});
it('streams private files with authentication and preserves the response MIME type', async () => {
  (FileSystem.fetchManaged as jest.Mock).mockReturnValue({
    cancel: jest.fn(),
    result: Promise.resolve({
      ok: true,
      status: 200,
      getHeader: (name: string) =>
        name === 'Content-Type'
          ? 'application/pdf'
          : 'attachment; filename="passport.pdf"',
    }),
  });
  const result = await downloadFile('/documents/id/download', {
    requiresAuth: true,
  });
  expect(result).toMatchObject({
    fileName: 'passport.pdf',
    mimeType: 'application/pdf',
  });
  expect(FileSystem.fetchManaged).toHaveBeenCalledWith(
    'http://localhost:4000/documents/id/download',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token-a' }),
    }),
    expect.any(Function),
  );
  expect(FileSystem.mv).toHaveBeenCalled();
});

it('does not let an old refresh restore credentials after switching accounts', async () => {
  let release!: (value: unknown) => void;
  fetchMock.mockResolvedValueOnce(response({}, 401)).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  const pending = request('/documents/stale', { requiresAuth: true });
  await new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });
  setAccessToken('new-account-token');
  release(
    response({
      accessToken: 'old-account-refreshed',
      user: { name: 'Old', email: 'old@example.test' },
    }),
  );
  await expect(pending).rejects.toMatchObject({ status: 401 });
  fetchMock.mockResolvedValue(response({}));
  await request('/auth/me/new', { requiresAuth: true });
  expect(fetchMock.mock.calls.at(-1)?.[1].headers.Authorization).toBe(
    'Bearer new-account-token',
  );
});

it('removes streamed private bytes when the account changes during a download', async () => {
  let finish!: (value: unknown) => void;
  (FileSystem.fetchManaged as jest.Mock).mockReturnValue({
    cancel: jest.fn(),
    result: new Promise(resolve => {
      finish = resolve;
    }),
  });
  const pending = downloadFile('/documents/private/download', {
    requiresAuth: true,
  });
  await new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });
  setAccessToken('different-account');
  finish({ ok: true, status: 200, getHeader: () => 'application/pdf' });
  await expect(pending).rejects.toMatchObject({ status: 401 });
  expect(FileSystem.unlink).toHaveBeenCalled();
});

it('refreshes authentication once for streamed downloads', async () => {
  const ok = {
    ok: true,
    status: 200,
    getHeader: (name: string) =>
      name === 'Content-Type'
        ? 'application/pdf'
        : 'attachment; filename="health%20record.pdf"',
  };
  (FileSystem.fetchManaged as jest.Mock)
    .mockReturnValueOnce({
      cancel: jest.fn(),
      result: Promise.resolve({ ok: false, status: 401 }),
    })
    .mockReturnValueOnce({ cancel: jest.fn(), result: Promise.resolve(ok) });










  fetchMock.mockResolvedValue(
    response({
      token: 'refreshed-token',
      user: { name: 'QA', email: 'qa@example.test' },
    }),
  );
  await expect(
    downloadFile('/documents/auth-retry/download', { requiresAuth: true }),
  ).resolves.toMatchObject({ fileName: 'health record.pdf' });
  expect(FileSystem.fetchManaged).toHaveBeenLastCalledWith(
    'http://localhost:4000/documents/auth-retry/download',
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer refreshed-token',
      }),
    }),
    expect.any(Function),
  );
});

it('keeps in-flight requests valid when the same login token is restored again', async () => {
  let release!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  const pending = request('/documents/same-session', { requiresAuth: true });
  setAccessToken('token-a');
  release(response({ ok: true }));
  await expect(pending).resolves.toEqual({ ok: true });
});

it('keeps in-flight requests valid when restoring the same access token', async () => {
  let release!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        release = resolve;
      }),
  );
  const pending = request('/documents/same-session', { requiresAuth: true });
  setAccessToken('token-a');
  release(response({ ok: true }));
  await expect(pending).resolves.toEqual({ ok: true });
});

it('recovers an opted-in timed-out read once without requiring a manual retry', async () => {
  jest.useFakeTimers();
  try {
    fetchMock
      .mockImplementationOnce(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new Error('aborted')),
            );
          }),
      )
      .mockResolvedValueOnce(response({ recovered: true }));
    const pending = request('/home/retry-timeout', {
      timeoutMs: 100,
      retryTransient: true,
    });
    await jest.advanceTimersByTimeAsync(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(500);
    await expect(pending).resolves.toEqual({ recovered: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

it('does not retry a cancelled read during backoff', async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockResolvedValue(response({ message: 'Unavailable' }, 503));
    const controller = new AbortController();
    const pending = request('/home/cancel-retry', {
      retryTransient: true,
      signal: controller.signal,
    });
    const rejected = (async () => {
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    })();
    await jest.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    await jest.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

it('bounds transient read retries and never retries writes or validation errors', async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockResolvedValue(response({ message: 'Unavailable' }, 503));
    const pending = request('/home/exhausted', { retryTransient: true });
    const rejected = (async () => {
      await expect(pending).rejects.toMatchObject({ status: 503 });
    })();
    await jest.advanceTimersByTimeAsync(500);
    await rejected;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockClear();
    await expect(
      request('/write/no-retry', { method: 'POST', retryTransient: true }),
    ).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock
      .mockClear()
      .mockResolvedValue(response({ message: 'Invalid' }, 400));
    await expect(
      request('/home/invalid', { retryTransient: true }),
    ).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

it('keeps a last loaded read available offline after its freshness TTL expires', async () => {
  const network = require('../network/connectivity');
  const snapshot = jest.spyOn(network, 'networkSnapshot');
  const connected = { offline: false, unreachable: false };
  snapshot.mockReturnValue(connected);
  try {
    fetchMock.mockResolvedValue(response({ count: 7 }));
    await request('/offline/cached', { requiresAuth: true, cacheMs: 1 });
    await new Promise<void>(resolve => setTimeout(() => resolve(), 5));
    snapshot.mockReturnValue({ ...connected, offline: true });
    await expect(
      request('/offline/cached', { requiresAuth: true, cacheMs: 1 }),
    ).resolves.toEqual({ count: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(
      request('/offline/uncached', { requiresAuth: true }),
    ).rejects.toMatchObject({ code: 'OFFLINE' });
    setAccountScope('different-owner');
    await expect(
      request('/offline/cached', { requiresAuth: true, cacheMs: 1 }),
    ).rejects.toMatchObject({ code: 'OFFLINE' });
  } finally {
    snapshot.mockRestore();
  }
});

it('keeps session credentials when token refresh encounters a service failure', async () => {
  fetchMock
    .mockResolvedValueOnce(response({}, 401))
    .mockResolvedValueOnce(response({}, 503));
  jest.mocked(sessionStorage.clear).mockClear();
  await expect(
    request('/session/service-failure', { requiresAuth: true }),
  ).rejects.toMatchObject({ status: 503 });
  expect(sessionStorage.clear).not.toHaveBeenCalled();
});


it('reuses document metadata and invalidates it after mutations and account changes', async () => {
    fetchMock.mockResolvedValue(response({ id: 'a' }));
    const read = () =>
      request('/documents/a', { requiresAuth: true, cacheMs: 30000 });
    await read();
    await read();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await request('/documents/a/details', {
      method: 'PATCH',
      requiresAuth: true,
      body: { notes: 'updated' },
    });
    await read();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    setAccessToken('other');
    await read();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

it('does not let an old request remove a newer in-flight read after invalidation', async () => {
    let old!: (value: unknown) => void, newer!: (value: unknown) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            old = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            newer = resolve;
          }),
      );
    const first = request('/same');
    invalidateReadCaches();
    const second = request('/same');
    old(response({ old: true }));
    await first;
    expect(request('/same')).toBe(second);
    newer(response({ new: true }));
    await second;
  });

it('rejects stale account data when the session changes during JSON decoding', async () => {
    let finish!: (value: unknown) => void;
    fetchMock.mockResolvedValue({
      ...response({}),
      json: () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    });
    const pending = request('/documents/private', { requiresAuth: true });
    await Promise.resolve();
    setAccessToken('other-account');
    finish({ private: true });
    await expect(pending).rejects.toMatchObject({ status: 401 });
  });

it('reopens a downloaded document without another network transfer and refreshes after a write', async () => {
    const transfer = () => ({
      cancel: jest.fn(),
      result: Promise.resolve({
        ok: true,
        status: 200,
        getHeader: (name: string) =>
          name === 'Content-Type'
            ? 'application/pdf'
            : 'attachment; filename="cached.pdf"',
      }),
    });
    const nativeFetch = FileSystem.fetchManaged as jest.Mock;
    nativeFetch.mockReset().mockImplementation(transfer);
    const read = () =>
      downloadFile('/documents/cached/download', {
        requiresAuth: true,
        cacheMs: 300000,
      });
    const first = await read();
    expect(await read()).toEqual(first);
    expect(nativeFetch).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(response({}));
    await request('/documents/cached/details', {
      method: 'PATCH',
      requiresAuth: true,
      body: {},
    });
    await read();
    expect(nativeFetch).toHaveBeenCalledTimes(2);
  });

it('cancels a timed-out read and clears its timeout', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new Error('aborted')),
            );
          }),
      );
      const pending = request('/slow', { timeoutMs: 500 });
      const verifyTimeout = async () => {
        await expect(pending).rejects.toMatchObject({ status: 408 });
      };
      const rejected = verifyTimeout();
      await jest.advanceTimersByTimeAsync(500);
      await rejected;
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
