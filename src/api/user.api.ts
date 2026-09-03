import { request } from './client';
import type { BootstrapResponse } from './types';

export const userApi = {
  bootstrap: () =>
    request<BootstrapResponse>('/api/bootstrap', { requiresAuth: true }),
};
