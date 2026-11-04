export type Issue = {
  kind:
    | 'offline'
    | 'connection'
    | 'service'
    | 'permission'
    | 'session'
    | 'validation'
    | 'unknown';
  title: string;
  message: string;
  next: string;
};
export function describeIssue(error: unknown): Issue {
  const value = error as
    { status?: number; code?: string; message?: string } | undefined;
  const message =
    value?.message ||
    (typeof error === 'string' ? error : 'The request could not be completed.');
  if (value?.code === 'OFFLINE')
    return {
      kind: 'offline',
      title: 'You’re offline',
      message: 'Your device has no network connection.',
      next: 'Read loaded records and downloaded files, or edit a draft. Reconnect before saving, uploading or sharing.',
    };
  if (value?.status === 401)
    return {
      kind: 'session',
      title: 'Sign in again',
      message: 'Your session has expired.',
      next: 'Your non-secret form drafts are kept on this device. Sign in with the same account to resume.',
    };
  if (value?.status === 403 || /PERMISSION|RESTRICTED/.test(value?.code ?? ''))
    return {
      kind: 'permission',
      title: 'Access is restricted',
      message,
      next:
        value?.status === 403
          ? 'Ask the record owner or an administrator for the required access, or go back to your own records.'
          : 'Allow this permission in Settings only if you want to use this feature. You can go back and choose a file instead.',
    };
  if (
    value?.status === 408 ||
    error instanceof TypeError ||
    /timed? out|took too long|network request failed/i.test(message)
  )
    return {
      kind: 'connection',
      title: 'Connection interrupted',
      message:
        'Readines did not receive a response in time. This can be the connection or the service.',
      next: 'Keep reading loaded content and retry when the connection improves.',
    };
  if ((value?.status ?? 0) >= 500)
    return {
      kind: 'service',
      title: 'Readines service is unavailable',
      message:
        'The service could not complete the request. Your input did not cause this response.',
      next: 'Keep your draft and try again shortly.',
    };
  if (value?.status === 429)
    return {
      kind: 'service',
      title: 'Too many requests',
      message: 'The service is temporarily limiting requests.',
      next: 'Wait a moment, then retry once.',
    };
  if (value?.status === 400 || value?.status === 422)
    return {
      kind: 'validation',
      title: 'Couldn’t save this change',
      message,
      next: 'Your selection is kept. Please try again.',
    };
  return {
    kind: 'unknown',
    title: 'Couldn’t complete this step',
    message,
    next: 'Your loaded content and form entries are kept. Retry, or go back and choose another way.',
  };
}
