import { request } from './client';
import type { AuthResponse, MessageResponse } from './types';

export const authApi = {
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),
  requestSignupOtp: (body: { name: string; email: string; password: string }) =>
    request<MessageResponse>('/auth/signup/request-otp', { method: 'POST', body }),
  signup: (body: { name: string; email: string; password: string; otp: string }) =>
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
  requestEmailChange: (body: { newEmail: string; currentPassword: string }) =>
    request<MessageResponse>('/auth/account/change-email/request', {
      method: 'POST',
      body,
      requiresAuth: true,
    }),
  verifyEmailChange: (body: { otp: string }) =>
    request<{ message: string; user: AuthResponse['user'] }>(
      '/auth/account/change-email/verify',
      { method: 'POST', body, requiresAuth: true },
    ),
  requestPasswordChange: (body: {
    currentPassword: string;
    newPassword: string;
  }) =>
    request<MessageResponse>('/auth/account/change-password/request', {
      method: 'POST',
      body,
      requiresAuth: true,
    }),
  verifyPasswordChange: (body: { otp: string }) =>
    request<MessageResponse>('/auth/account/change-password/verify', {
      method: 'POST',
      body,
      requiresAuth: true,
    }),
  loginWithPin: (body: { email: string; pin: string }) =>
    request<AuthResponse>('/auth/login/pin', { method: 'POST', body }),
  forgotPasswordOtp: (email: string) =>
    request<MessageResponse>('/auth/forgot-password/otp', {
      method: 'POST',
      body: { email },
    }),
  resetPasswordOtp: (body: { email: string; otp: string; password: string }) =>
    request<MessageResponse>('/auth/reset-password/otp', {
      method: 'POST',
      body,
    }),
  setupPin: (pin: string) =>
    request<{ message: string; user: AuthResponse['user'] }>(
      '/auth/account/pin/setup',
      { method: 'POST', body: { pin }, requiresAuth: true },
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
  logout: () => request<MessageResponse>('/auth/logout', { method: 'POST' }),
  logoutAll: () =>
    request<MessageResponse>('/auth/logout-all', {
      method: 'POST',
      requiresAuth: true,
    }),
};
