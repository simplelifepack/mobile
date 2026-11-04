import {
  unlockVerified,
  appLockReducer,
  lockLoading,
  lockConfigured,
  lockLoadFailed,
  locked,
  unlocked,
  lockSettingsChanged,
  lockCleared,
} from './appLockSlice';
const loaded = (enabled = true) =>
  appLockReducer(
    appLockReducer(undefined, lockLoading('a')),
    lockConfigured({ accountId: 'a', enabled, biometrics: enabled }),
  );
it('starts enabled accounts locked before the archive can be shown', () => {
  expect(loaded()).toMatchObject({
    ready: true,
    enabled: true,
    locked: true,
    biometrics: true,
  });

  expect(loaded(false)).toMatchObject({
    ready: true,
    locked: false,
    biometrics: false,
  });
});
it('relocks after verification on backgrounding but does not lock disabled accounts', () => {
  const verified = appLockReducer(loaded(), unlocked());
  expect(verified.locked).toBe(false);
  expect(appLockReducer(verified, locked()).locked).toBe(true);
  expect(appLockReducer(loaded(false), locked()).locked).toBe(false);
});
it('fails closed on an unreadable preference and does not accept stale-account hydration', () => {
  const loading = appLockReducer(undefined, lockLoading('a'));
  expect(
    appLockReducer(
      loading,
      lockConfigured({ accountId: 'other', enabled: false, biometrics: false }),
    ).ready,
  ).toBe(false);
  expect(appLockReducer(loading, lockLoadFailed('a'))).toMatchObject({
    ready: true,
    locked: true,
    enabled: true,
  });
  expect(appLockReducer(loading, unlocked()).locked).toBe(true);
});
it('updates settings in place and clears account state on logout', () => {
  const verified = appLockReducer(loaded(), unlocked());
  expect(
    appLockReducer(
      verified,
      lockSettingsChanged({ accountId: 'a', enabled: true, biometrics: false }),
    ).locked,
  ).toBe(false);
  expect(
    appLockReducer(
      loaded(),
      lockSettingsChanged({
        accountId: 'a',
        enabled: false,
        biometrics: false,
      }),
    ).locked,
  ).toBe(false);
  expect(appLockReducer(loaded(), lockCleared())).toMatchObject({
    accountId: null,
    enabled: false,
    locked: false,
    ready: false,
  });
});


it('rejects verification that finishes after a background transition or for a different account', () => {
  const original = loaded();
  const backgrounded = appLockReducer(original, locked());
  expect(appLockReducer(backgrounded, unlockVerified({ accountId: 'a', generation: original.generation })).locked).toBe(true);
  expect(appLockReducer(original, unlockVerified({ accountId: 'b', generation: original.generation })).locked).toBe(true);
  expect(appLockReducer(original, unlockVerified({ accountId: 'a', generation: original.generation })).locked).toBe(false);
});
