import { request } from './client';
import type {
  TrustCenterResponse,
  TrustInvitation,
  TrustMember,
  TrustMemberPayload,
} from './types';

export const trustApi = {
  get: () =>
    request<TrustCenterResponse>('/api/trust', { requiresAuth: true }),
  getInvitation: (token: string) =>
    request<TrustInvitation>(
      `/api/trust/invitations/${encodeURIComponent(token)}`,
    ),
  acceptInvitation: (token: string, pin: string) =>
    request<{ message: string }>(
      `/api/trust/invitations/${encodeURIComponent(token)}/accept`,
      { method: 'POST', body: { pin } },
    ),
  rejectInvitation: (token: string) =>
    request<{ message: string }>(
      `/api/trust/invitations/${encodeURIComponent(token)}/reject`,
      { method: 'POST' },
    ),
  addMember: (payload: TrustMemberPayload) =>
    request<TrustMember>('/api/trust/members', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  addFamilyMember: (payload: TrustMemberPayload) =>
    request<TrustMember>('/api/trust/family-members', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  updateMember: (id: string, payload: Partial<TrustMemberPayload>) =>
    request<TrustMember>(`/api/trust/members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload,
      requiresAuth: true,
    }),
  resendInvitation: (id: string) =>
    request<TrustMember>(
      `/api/trust/members/${encodeURIComponent(id)}/resend-invitation`,
      { method: 'POST', requiresAuth: true },
    ),
  resetInvitationPin: (id: string, pin: string) =>
    request<TrustMember>(
      `/api/trust/members/${encodeURIComponent(id)}/reset-pin`,
      { method: 'POST', body: { pin }, requiresAuth: true },
    ),
  revokeMember: (id: string) =>
    request<void>(`/api/trust/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  leaveConnection: (id: string) =>
    request<void>(`/api/trust/connections/${encodeURIComponent(id)}/leave`, {
      method: 'POST',
      requiresAuth: true,
    }),
};
