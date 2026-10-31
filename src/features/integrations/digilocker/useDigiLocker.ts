import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { ApiError } from '../../../api/client';
import {
  digilockerApi,
  type LockerDocument,
  type LockerSession,
} from '../../../api/digilocker.api';
import { useAppSelector } from '../../../app/store/hooks';
import { pendingSession } from './pendingSession';
import {
  completedReferences,
  importableDocuments,
  isConnected,
  MAX_IMPORT_BATCH,
  MAX_POLL_INTERVAL_MS,
  POLL_INTERVAL_MS,
  STATUS_MESSAGES,
  TERMINAL_STATUSES,
} from './lockerState';

const toMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'DigiLocker could not complete the request.';

async function cancelQuietly(sessionId: string) {
  try {
    await digilockerApi.cancel(sessionId);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
}

export function useDigiLocker(onImported: () => void) {
  const userId = useAppSelector(state => state.auth.user?.id ?? '');
  const [sessionId, setSessionId] = useState('');
  const [session, setSession] = useState<LockerSession | null>(null);
  const [documents, setDocuments] = useState<LockerDocument[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;

  const reset = useCallback(() => {
    setSessionId('');
    setSession(null);
    setDocuments([]);
    setSelection([]);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const status = await digilockerApi.status();
      setConfigured(status.configured);
      if (!status.configured) {
        setMessage(status.message ?? 'DigiLocker is not configured.');
        return;
      }
      const id = await pendingSession.read(userId);
      if (!id) return;
      const current = await digilockerApi.session(id);
      setSessionId(id);
      setSession(current);
      if (isConnected(current)) {
        setDocuments((await digilockerApi.documents(id)).documents);
        setMessage('');
      } else {
        setDocuments([]);
        setSelection([]);
        setMessage(STATUS_MESSAGES[current.status] ?? 'Please reconnect DigiLocker.');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await pendingSession.clear(userId);
        reset();
      } else {
        setMessage(toMessage(error));
      }
    } finally {
      setBusy(false);
    }
  }, [reset, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The user authorizes in the browser, so re-check when the app returns to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const status = session?.status;
  useEffect(() => {
    if (!sessionId || (status !== 'IMPORTING' && status !== 'PENDING')) return;
    let active = true;
    let delay = POLL_INTERVAL_MS;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await digilockerApi.session(sessionId);
        if (!active) return;
        delay = POLL_INTERVAL_MS;
        setSession(next);
        if (status === 'PENDING' && next.status === 'AUTHENTICATED') {
          const result = await digilockerApi.documents(sessionId);
          if (active) setDocuments(result.documents);
        }
        const done = completedReferences(next);
        setSelection(current => current.filter(ref => !done.has(ref)));
        if (TERMINAL_STATUSES.includes(next.status)) {
          setSelection([]);
          setMessage(
            next.status === 'EXPIRED'
              ? 'DigiLocker access expired. Reconnect to continue.'
              : 'This connection ended. Reconnect to retry remaining documents.',
          );
        }
        if (status === 'IMPORTING' && next.status !== 'IMPORTING') onImportedRef.current();
        if (next.status !== status) return;
      } catch {
        if (!active) return;
        delay = Math.min(MAX_POLL_INTERVAL_MS, delay * 2);
        setMessage('Unable to refresh progress. Retrying automatically.');
      }
      timer = setTimeout(poll, delay);
    };
    timer = setTimeout(poll, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sessionId, status]);

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(toMessage(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const connect = useCallback(
    () =>
      run(async () => {
        if (sessionId) await cancelQuietly(sessionId);
        const next = await digilockerApi.start();
        await pendingSession.write(userId, next.id);
        setSessionId(next.id);
        setSession(next);
        setDocuments([]);
        setSelection([]);
        await Linking.openURL(next.authorizationUrl);
      }),
    [run, sessionId, userId],
  );

  const disconnect = useCallback(
    () =>
      run(async () => {
        if (sessionId) await cancelQuietly(sessionId);
        await pendingSession.clear(userId);
        reset();
      }),
    [reset, run, sessionId, userId],
  );

  const importSelected = useCallback(
    () =>
      run(async () => {
        if (!selection.length || session?.status !== 'AUTHENTICATED') return;
        try {
          setSession(await digilockerApi.import(sessionId, selection));
          onImportedRef.current();
        } catch (error) {
          setSession(await digilockerApi.session(sessionId).catch(() => session));
          throw error;
        }
      }),
    [run, selection, session, sessionId],
  );

  const toggle = useCallback(
    (reference: string) =>
      setSelection(current =>
        current.includes(reference)
          ? current.filter(ref => ref !== reference)
          : [...current, reference].slice(0, MAX_IMPORT_BATCH),
      ),
    [],
  );

  const selectAll = useCallback(
    () =>
      setSelection(
        importableDocuments(documents, session)
          .slice(0, MAX_IMPORT_BATCH)
          .map(doc => doc.reference),
      ),
    [documents, session],
  );

  return {
    session,
    documents,
    selection,
    configured,
    busy,
    message,
    connect,
    disconnect,
    refresh,
    importSelected,
    toggle,
    selectAll,
    clearSelection: () => setSelection([]),
  };
}
