import { request } from './client';
import type { AuthResponse, MessageResponse } from './types';

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),
  loginWithPin: (body: { email: string; pin: string }) =>
    request<AuthResponse>('/auth/login/pin', { method: 'POST', body }),
  requestSignupOtp: (body: { name: string; email: string; password: string }) =>
    request<MessageResponse>('/auth/signup/request-otp', {
      method: 'POST',
      body,
    }),
  signup: (body: {
    name: string;
    email: string;
    password: string;
    otp: string;
  }) => request<AuthResponse>('/auth/signup', { method: 'POST', body }),
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
  setupPin: (pin: string) =>
    request<{ message: string; user: AuthResponse['user'] }>(
      '/auth/account/pin/setup',
      {
        method: 'POST',
        body: { pin },
        requiresAuth: true,
      },
    ),
  changePin: (body: { currentPin: string; newPin: string }) =>
    request<MessageResponse>('/auth/account/pin/change', {
      method: 'POST',
      body,
      requiresAuth: true,
    }),
  requestPinReset: () =>
    request<MessageResponse>('/auth/account/pin/reset/request', {
      method: 'POST',
      requiresAuth: true,
    }),
  resetPin: (body: { otp: string; newPin: string }) =>
    request<MessageResponse>('/auth/account/pin/reset/verify', {
      method: 'POST',
      body,
      requiresAuth: true,
    }),
  logout: () => request<MessageResponse>('/auth/logout', { method: 'POST', timeoutMs: 3000 }),
};
