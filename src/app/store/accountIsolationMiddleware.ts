import { sessionGateEmail, setSessionGate } from '../../security/sessionGate';
import type { Middleware } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { setAccountScope } from '../../api/client';

export const accountIsolationMiddleware: Middleware =
  store => next => action => {
    const before = store.getState().auth.user?.id;
    const result = next(action);
    const auth = store.getState().auth;
    const after = auth.user?.id;
    if (!auth.user || (auth.status === 'authenticated' && auth.user.email === sessionGateEmail()))
      setSessionGate(null);
    if (before !== after) {
      setAccountScope(after ?? null);
      store.dispatch(api.util.resetApiState());
    }
    return result;
  };
