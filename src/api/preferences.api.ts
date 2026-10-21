import { request } from './client';
import type { ThemeMode } from '../design/theme/types';

export type UserPreferences = {
  country: string | null;
  passportCountry: string | null;
  homeCurrency: string | null;
  appearance: ThemeMode;
  aiProcessingEnabled: boolean;
};

export const preferencesApi = {
  get: () =>
    request<UserPreferences>('/api/preferences', { requiresAuth: true }),
  update: (payload: Partial<UserPreferences>) =>
    request<UserPreferences>('/api/preferences', {
      method: 'PATCH',
      body: payload,
      requiresAuth: true,
    }),
};
