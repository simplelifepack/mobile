import { request } from './client';
import type { BootstrapResponse } from './types';

export const userApi = {
  bootstrap: () =>
    request<BootstrapResponse>('http://192.168.31.231:4000/', { requiresAuth: true }),
};
