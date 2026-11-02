import { request } from './client';
import type { TrustCenterResponse } from './types';

// Only the member list is consumed (holding owner picker); sharing flows were removed.
export const trustApi = {
  get: () =>
    request<TrustCenterResponse>('/api/trust', { requiresAuth: true }),
};
