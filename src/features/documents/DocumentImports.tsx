import { DetailSheet } from '../shared/DetailSheet';
import React from 'react';
import { ActivityIndicator, AppState, Linking } from 'react-native';
import { digiLockerSessionStorage } from '../../api/digilockerSessionStorage';
import { useAppSelector } from '../../app/store/hooks';
import { Card } from '../../components/primitives/Card';
import {
  digilockerApi,
  type LockerDocument,
  type DigiLockerSession,
} from '../../api/digilocker.api';
import { Stack, AppText, Button, useAction } from '../shared/FeatureUI';
export function DocumentImports(
  props: Omit<React.ComponentProps<typeof AccountDocumentImports>, 'userId'>,
) {
  const userId = useAppSelector(state => state.auth.user?.id);
  return userId ? (
    <AccountDocumentImports key={userId} {...props} userId={userId} />
  ) : null;
}
function AccountDocumentImports({
  onRefresh,
  returnSession,
  returnError,
  userId,
  openRequest,
  hideTrigger = false,
}: {
  userId: string;
  returnSession?: string;
  returnError?: string;
  openRequest?: number;
  hideTrigger?: boolean;
  onRefresh: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (openRequest) {
      setOpen(true);
    }
  }, [openRequest]);
  const [session, setSession] = React.useState('');
  const [authorizationUrl, setAuthorizationUrl] = React.useState<string>();
  const [restoring, setRestoring] = React.useState(true);
  const [checking, setChecking] = React.useState(false);
  const checkingRef = React.useRef(false);
  const lastProgress = React.useRef('');
  const [lockerMessage, setLockerMessage] = React.useState('');
  const refreshRef = React.useRef(onRefresh);
  refreshRef.current = onRefresh;
  const mounted = React.useRef(true);
  const currentSession = React.useRef(session);
  currentSession.current = session;
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [lockerDocuments, setLockerDocuments] = React.useState<
    LockerDocument[]
  >([]);
  const [references, setReferences] = React.useState<string[]>([]);
  const [lockerStatus, setLockerStatus] = React.useState<DigiLockerSession>();
  const action = useAction(onRefresh);
  const checkLocker = React.useCallback(async (id: string) => {
    const status = await digilockerApi.sessionStatus(id);
    if (!mounted.current || currentSession.current !== id) return status;
    if (status.status === 'AUTHENTICATED') {
      const result = await digilockerApi.documents(id);
      if (mounted.current && currentSession.current === id)
        setLockerDocuments(result.documents);
      else return status;
    } else if (status.status !== 'IMPORTING') {
      setLockerDocuments([]);
      setReferences([]);
    }
    setLockerStatus(status);
    const progressKey = JSON.stringify(status.progress);
    if (
      status.progress?.some(item => item.phase === 'Completed') &&
      lastProgress.current !== progressKey
    ) {
      lastProgress.current = progressKey;
      refreshRef.current();
    }
    setLockerMessage(
      (
        {
          EXPIRED: 'Your DigiLocker session expired. Start again.',
          FAILED: status.progress?.length
            ? 'Some documents could not be imported. Completed copies are saved. Connect again to retry.'
            : 'DigiLocker sign-in failed. Please reconnect.',
          CONSENT_DENIED:
            'DigiLocker consent was declined. You can start again.',
          CANCELLED: 'DigiLocker disconnected. Imported copies are retained.',
        } as Record<string, string>
      )[status.status] ?? '',
    );
    return status;
  }, []);
  React.useEffect(() => {
    let active = true;
    void (async () => {
      const pending = await digiLockerSessionStorage.read(userId);
      if (!active) return;
      if (returnSession && pending?.id !== returnSession) {
        setOpen(true);
        setLockerMessage(
          'This DigiLocker return does not match your pending connection. Start again.',
        );
        return;
      }
      if (returnError) {
        setOpen(true);
        if (!pending)
          setLockerMessage(
            'DigiLocker sign-in did not complete. Please connect again.',
          );
      }
      if (returnError) {
        setOpen(true);
        if (!pending)
          setLockerMessage(
            'DigiLocker sign-in did not complete. Please connect again.',
          );
      }
      if (pending) {
        setSession(pending.id);
        setAuthorizationUrl(pending.authorizationUrl);
        if (returnSession) setOpen(true);
      }
    })()
      .catch(() => {
        if (active)
          setLockerMessage(
            'Unable to restore DigiLocker session. Please retry.',
          );
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [returnSession, returnError, userId]);
  React.useEffect(() => {
    if (!open || !session) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!active || AppState.currentState !== 'active') return;
      if (checkingRef.current) {
        timer = setTimeout(poll, 250);
        return;
      }
      checkingRef.current = true;
      setChecking(true);
      try {
        const status = await checkLocker(session);
        if (active && ['PENDING', 'IMPORTING'].includes(status.status))
          timer = setTimeout(poll, 2000);
      } catch (error) {
        if (active)
          setLockerMessage(
            error instanceof Error
              ? error.message
              : 'Unable to refresh your connection. We’ll retry automatically.',
          );
        if (active) timer = setTimeout(poll, 5000);
      } finally {
        checkingRef.current = false;
        if (mounted.current) setChecking(false);
      }
    };
    void poll();
    const listener = AppState.addEventListener('change', state => {
      clearTimeout(timer);
      if (state === 'active') void poll();
    });
    return () => {
      active = false;
      clearTimeout(timer);
      listener.remove();
    };
  }, [open, session, lockerStatus?.status, checkLocker]);
  const connect = (restart = false) => {
    void action.run(async () => {
      if (!restart && lockerStatus?.status === 'PENDING' && authorizationUrl) {
        if (
          !/^https:\/\/digilocker\.meripehchaan\.gov\.in\//.test(
            authorizationUrl,
          )
        )
          throw new Error(
            'Invalid DigiLocker sign-in address. Please reconnect.',
          );
        await Linking.openURL(authorizationUrl);
        return;
      }
      const status = await digilockerApi.status();
      if (!status.configured)
        throw new Error(status.message ?? 'DigiLocker is not configured.');
      if (session) {
        try {
          await digilockerApi.cancel(session);
        } catch (error) {
          if (!(
            error instanceof Error &&
            'status' in error &&
            error.status === 404
          ))
            throw error;
        }
      }
      const result = await digilockerApi.start();
      try {
        await digiLockerSessionStorage.save(
          userId,
          result.id,
          result.authorizationUrl,
        );
      } catch (error) {
        await digilockerApi.cancel(result.id);
        throw error;
      }
      if (!mounted.current) return;
      setReferences([]);
      setLockerDocuments([]);
      setLockerMessage('');
      setSession(result.id);
      setAuthorizationUrl(result.authorizationUrl);
      setLockerStatus(result);
      const url = result.authorizationUrl;
      try {
        if (!url || !/^https:\/\/digilocker\.meripehchaan\.gov\.in\//.test(url))
          throw new Error('No valid consent URL returned.');
        await Linking.openURL(url);
      } catch (error) {
        await digilockerApi.cancel(result.id);
        await digiLockerSessionStorage.clear(userId);
        currentSession.current = '';
        setSession('');
        setLockerStatus(undefined);
        throw error;
      }
    }, '');
  };
  const disconnect = () => {
    void action.run(async () => {
      await digilockerApi.cancel(session);
      await digiLockerSessionStorage.clear(userId);
      currentSession.current = '';
      setLockerStatus(undefined);
      setAuthorizationUrl(undefined);
      setLockerMessage(
        'DigiLocker disconnected. Imported copies are retained.',
      );
      setSession('');
      setLockerDocuments([]);
      setReferences([]);
    }, '');
  };
  const status = lockerStatus?.status;
  const pending = status === 'PENDING';
  const ready = status === 'AUTHENTICATED';
  const importing = status === 'IMPORTING';
  const supported = lockerDocuments.filter(doc => doc.available);
  const completed =
    lockerStatus?.progress?.filter(item => item.phase === 'Completed').length ??
    0;
  const imported =
    lockerStatus?.progress?.filter(
      item => item.phase === 'Completed' && !item.duplicate,
    ).length ?? 0;
  const duplicates = completed - imported;
  const hasProgress = Boolean(lockerStatus?.progress?.length);
  const resolving = restoring || Boolean(session && !status && !lockerMessage);
  const busy = action.busy || resolving;
  const refreshStatus = () => {
    void action.run(() => checkLocker(session), '');
  };
  return (
    <>
      {!hideTrigger ? (
        <Button
          title="DigiLocker"
          variant="secondary"
          onPress={() => setOpen(true)}
        />
      ) : null}
      {open ? (
        <DetailSheet
          title="Import from DigiLocker"
          onClose={() => setOpen(false)}
        >
          <Stack>
            {resolving ? (
              <>
                <ActivityIndicator accessibilityLabel="Checking DigiLocker connection" />
                <AppText>Checking your connection…</AppText>
              </>
            ) : null}
            {!resolving && !pending && !ready && !importing ? (
              <>
                <AppText>Bring your issued documents into Readines.</AppText>
                <AppText color="secondary">
                  Sign in to DigiLocker, then choose the documents you want to
                  copy.
                </AppText>
                <Button
                  title={session ? 'Connect again' : 'Connect DigiLocker'}
                  disabled={busy}
                  onPress={() => connect()}
                />
              </>
            ) : null}
            {pending ? (
              <>
                <AppText>Finish signing in to DigiLocker</AppText>
                <AppText color="secondary">
                  Complete sign-in and allow access in your browser. Your
                  documents will appear here when you return.
                </AppText>
                <Button
                  title={
                    authorizationUrl
                      ? 'Continue in DigiLocker'
                      : 'Sign in again'
                  }
                  disabled={busy}
                  onPress={() => connect()}
                />
                <AppText variant="caption" color="muted">
                  Already finished? We check automatically when you return.
                </AppText>
                <Button
                  title="Start over"
                  variant="ghost"
                  disabled={busy}
                  onPress={() => connect(true)}
                />
              </>
            ) : null}
            {ready ? (
              <>
                <AppText>
                  {hasProgress
                    ? `${imported} imported${duplicates ? ` · ${duplicates} already in your documents` : ''}`
                    : 'Choose documents to import'}
                </AppText>
                {lockerDocuments.length ? (
                  <>
                    <AppText color="secondary">
                      {references.length} selected · {supported.length}{' '}
                      available
                    </AppText>
                    {supported.length ? (
                      <Button
                        title={
                          references.length === Math.min(supported.length, 50)
                            ? 'Clear selection'
                            : 'Select all supported documents'
                        }
                        variant="ghost"
                        disabled={busy}
                        onPress={() => {
                          setReferences(
                            references.length === Math.min(supported.length, 50)
                              ? []
                              : supported
                                  .slice(0, 50)
                                  .map(item => item.reference),
                          );
                        }}
                      />
                    ) : null}
                    {lockerDocuments.map(document => (
                      <Card key={document.reference}>
                        <Stack gap="sm">
                          <AppText>{document.name}</AppText>
                          <AppText variant="caption" color="secondary">
                            {[document.issuer, document.type]
                              .filter(Boolean)
                              .join(' · ')}
                          </AppText>
                          {document.modifiedAt ? (
                            <AppText variant="caption" color="muted">
                              Updated {document.modifiedAt}
                            </AppText>
                          ) : null}
                          {document.available ? (
                            <Button
                              title={
                                references.includes(document.reference)
                                  ? 'Selected'
                                  : 'Select document'
                              }
                              accessibilityLabel={`${references.includes(document.reference) ? 'Deselect' : 'Select'} ${document.name}`}
                              accessibilityState={{
                                selected: references.includes(
                                  document.reference,
                                ),
                              }}
                              variant="secondary"
                              disabled={busy}
                              onPress={() => {
                                setReferences(ids =>
                                  ids.includes(document.reference)
                                    ? ids.filter(
                                        id => id !== document.reference,
                                      )
                                    : ids.length < 50
                                      ? [...ids, document.reference]
                                      : ids,
                                );
                              }}
                            />
                          ) : (
                            <AppText variant="caption" color="muted">
                              {document.reason ?? 'Not available for import'}
                            </AppText>
                          )}
                        </Stack>
                      </Card>
                    ))}
                    {references.length ? (
                      <>
                        <AppText color="secondary">
                          Readines will securely copy your selected DigiLocker
                          documents into your account. These copies will be
                          encrypted. Your existing AI processing preference
                          applies.
                        </AppText>
                        <Button
                          title="Import selected documents"
                          disabled={busy}
                          onPress={() => {
                            void action.run(async () => {
                              const result = await digilockerApi.import(
                                session,
                                references,
                              );
                              setLockerStatus(result);
                            }, '');
                          }}
                        />
                      </>
                    ) : null}
                    {supported.length > 50 ? (
                      <AppText variant="caption" color="muted">
                        You can import up to 50 documents at a time.
                      </AppText>
                    ) : null}
                  </>
                ) : (
                  <>
                    <AppText color="secondary">
                      No issued documents were shared with Readines. You can
                      refresh or reconnect to grant access.
                    </AppText>
                    <Button
                      title="Refresh documents"
                      variant="secondary"
                      disabled={busy || checking}
                      onPress={refreshStatus}
                    />
                  </>
                )}
              </>
            ) : null}
            {importing ? (
              <>
                <ActivityIndicator accessibilityLabel="Importing DigiLocker documents" />
                <AppText>Importing your documents…</AppText>
                <AppText color="secondary">
                  {completed} completed. You can close this screen; your import
                  will continue.
                </AppText>
              </>
            ) : null}
            {(ready || importing) && hasProgress ? (
              <Stack gap="sm">
                {lockerStatus?.progress?.map(item => (
                  <AppText key={item.reference} variant="caption">
                    {lockerDocuments.find(
                      doc => doc.reference === item.reference,
                    )?.name ?? 'Document'}
                    : {item.duplicate ? 'Already imported' : item.phase}
                    {item.message ? ` · ${item.message}` : ''}
                  </AppText>
                ))}
              </Stack>
            ) : null}
            {action.busy ? (
              <ActivityIndicator accessibilityLabel="Working on DigiLocker connection" />
            ) : null}
            {lockerMessage ? (
              <AppText accessibilityLiveRegion="polite">
                {lockerMessage}
              </AppText>
            ) : null}
            {action.message ? (
              <AppText accessibilityLiveRegion="polite">
                {action.message}
              </AppText>
            ) : null}
            {session && !restoring ? (
              <Button
                title={pending ? 'Cancel connection' : 'Disconnect DigiLocker'}
                variant="ghost"
                disabled={action.busy}
                onPress={disconnect}
              />
            ) : null}
          </Stack>
        </DetailSheet>
      ) : null}
    </>
  );
}
