import * as Keychain from 'react-native-keychain';
import {
  readDraft,
  writeDraft,
  clearDraft,
  flushDrafts,
  safeDraft,
} from './formDraftStorage';
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
}));
it('flushes pending edits before expiry, excludes credentials, and isolates accounts', async () => {
  jest.useFakeTimers();
  try {
    const first = writeDraft('owner-a', 'record', {
      title: 'First',
      password: 'never-store',
      pin: '123456',
      otp: '123456',
      notes: 'Draft note',
    });
    const latest = writeDraft('owner-a', 'record', {
      title: 'Latest',
      password: 'never-store',
      notes: 'Draft note',
    });
    await expect(flushDrafts()).resolves.toBe(true);
    await first;
    await latest;
    expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1);
    const args = jest.mocked(Keychain.setGenericPassword).mock.calls[0];
    expect(args[1]).toContain('Latest');
    expect(args[1]).not.toContain('never-store');
    expect(args[2]).toMatchObject({
      service: 'com.readines.form-drafts.owner-a',
      accessible: 'device-only',
    });
    expect(await readDraft('owner-b', 'record')).toBeUndefined();
    expect(await readDraft('owner-a', 'record')).toEqual({
      title: 'Latest',
      notes: 'Draft note',
    });
    await clearDraft('owner-a', 'record');
    expect(await readDraft('owner-a', 'record')).toBeUndefined();
    expect(
      safeDraft({
        newPassword: 'x',
        confirmPin: 'x',
        accessToken: 'x',
        label: 'Keep',
      }),
    ).toEqual({ label: 'Keep' });
  } finally {
    jest.useRealTimers();
  }
});
it('reports a failed secure write instead of claiming the draft is safe', async () => {
  jest.mocked(Keychain.setGenericPassword).mockResolvedValueOnce(false);
  const pending = writeDraft('storage-failure', 'form', { title: 'Unsaved' });
  const failure = (async () => {
    await expect(pending).rejects.toThrow('Secure draft storage');
  })();
  await expect(flushDrafts()).resolves.toBe(false);
  await failure;
});
