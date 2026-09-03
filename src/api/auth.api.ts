import { request } from './client';
import type { AuthResponse, MessageResponse } from './types';

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),
  signup: (body: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body }),
  google: (credential: string) =>
    request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: { credential },
    }),
  forgotPassword: (email: string) =>
    request<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
  me: () =>
    request<{ user: AuthResponse['user'] }>('/auth/me', { requiresAuth: true }),
  logout: () => request<MessageResponse>('/auth/logout', { method: 'POST' }),
};
