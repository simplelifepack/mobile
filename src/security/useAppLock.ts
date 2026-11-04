import React from 'react';
import { AppState } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import { appLockStorage } from './appLockStorage';
import {
  lockCleared,
  lockConfigured,
  locked,
  lockLoading,
  lockLoadFailed,
} from './appLockSlice';

export function useAppLock(accountId?: string) {
  const dispatch = useAppDispatch();
  const state = useAppSelector(store => store.appLock);
  React.useEffect(() => {
    if (!accountId) {
      dispatch(lockCleared());
      return;
    }
    let active = true;
    dispatch(lockLoading(accountId));
    appLockStorage
      .read(accountId)
      .then(settings => {
        if (active) dispatch(lockConfigured({ accountId, ...settings }));
      })
      .catch(() => {
        if (active) dispatch(lockLoadFailed(accountId));
      });
    return () => {
      active = false;
    };
  }, [accountId, dispatch]);
  React.useEffect(() => {
    if (!accountId) return;
    const listener = AppState.addEventListener('change', next => {
      // Permission and biometric dialogs make iOS inactive without leaving
      // the app. Lock on actual backgrounding so those dialogs cannot loop.
      if (next === 'background') dispatch(locked());
    });
    return () => listener.remove();
  }, [accountId, dispatch]);
  return {
    ...state,
    ready: Boolean(accountId && state.ready && state.accountId === accountId),
  };
}
