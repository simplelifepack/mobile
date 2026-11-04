import React from 'react';
import { Download } from 'lucide-react-native';
import { mobileApi } from '../../api/mobile.api';
import { openDownload } from '../../native/documentFiles';
import { DetailSheet } from '../shared/DetailSheet';
import { AppText, Button } from '../shared/FeatureUI';
import { SettingsRow } from './SettingsUI';
export function AccountExport() {
  const [open, setOpen] = React.useState(false);
  const [id, setId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [poll, checkAgain] = React.useReducer((value: number) => value + 1, 0);
  const running = React.useRef(false);
  React.useEffect(() => {
    if (!open || !id) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const check = async () => {
      try {
        const result = await mobileApi.account.exportStatus(id);
        if (!active) return;
        setStatus(result.status);
        if (result.status === 'FAILED') {
          setError(result.errorMessage || 'Export failed.');
          return;
        }
        if (result.status !== 'READY' && ++attempts < 20)
          timer = setTimeout(check, 1500);
      } catch (reason) {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to check export.',
          );
      }
    };
    void check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, id, poll]);
  const prepare = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const job = await mobileApi.account.requestExport();
      setId(job.id);
      setStatus(job.status);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to prepare export.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const download = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await openDownload(await mobileApi.account.downloadExport(id));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to download export.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <SettingsRow
        Icon={Download}
        label="Export all data"
        description="Documents, records and your account data in a ZIP"
        value={
          id && status !== 'FAILED'
            ? status === 'READY'
              ? 'Ready'
              : 'Preparing'
            : undefined
        }
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DetailSheet
          title="Export all data"
          busy={busy}
          onClose={() => setOpen(false)}
        >
          <AppText>
            Prepare a ZIP of your user-owned data and uploaded files. You can
            close this screen while it is preparing and return to check its
            status.
          </AppText>
          {error ? <AppText color="danger">{error}</AppText> : null}
          {id ? (
            <AppText color="muted">
              {status === 'READY'
                ? 'Your export is ready to download.'
                : status === 'FAILED'
                  ? 'The export could not be prepared.'
                  : 'Your export is preparing. Status updates automatically for 30 seconds; check again if it needs longer.'}
            </AppText>
          ) : null}
          {!id || status === 'FAILED' ? (
            <Button
              title={busy ? 'Preparing…' : 'Prepare ZIP'}
              disabled={busy}
              onPress={() => {
                void prepare();
              }}
            />
          ) : status === 'READY' ? (
            <Button
              title={busy ? 'Opening…' : 'Download ZIP'}
              disabled={busy}
              onPress={() => {
                void download();
              }}
            />
          ) : (
            <Button
              title="Check status"
              disabled={busy}
              onPress={() => {
                setError('');
                checkAgain();
              }}
            />
          )}
        </DetailSheet>
      ) : null}
    </>
  );
}
