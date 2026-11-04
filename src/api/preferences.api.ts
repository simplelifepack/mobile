import { request } from './client';
export type UserPreferences = {
  country: string | null;
  passportCountry: string | null;
  homeCurrency: string | null;
  appearance: 'light' | 'dark' | 'system';
  aiProcessingEnabled: boolean;
};
export const preferencesApi = {
  get: () =>
    request<UserPreferences>('/api/preferences', { requiresAuth: true }),
  update: (body: Partial<UserPreferences>) =>
    request<UserPreferences>('/api/preferences', {
      method: 'PATCH',
      body,
      requiresAuth: true,
    }),
};
