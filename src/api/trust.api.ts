import { request } from './client';

export type TrustAccess = 'VIEW_ONLY' | 'FAMILY_MEMBER' | 'EMERGENCY_ACCESS';
export type TrustRelation = 'SPOUSE' | 'PARENT' | 'CHILD' | 'SIBLING' | 'GUARDIAN' | 'RELATIVE' | 'FRIEND' | 'OTHER';
export type TrustBloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
export type TrustPermission = {
  module: 'DOCUMENTS' | 'HEALTH' | 'WEALTH';
  canView: boolean;
  canDownload: boolean;
};
export type TrustMember = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  relation: TrustRelation;
  relationLabel: string;
  customRelation: string | null;
  dateOfBirth: string | null;
  bloodGroup: TrustBloodGroup | null;
  accessType: { id: TrustAccess; name: string };
  status: 'INVITED' | 'ACTIVE' | 'REJECTED' | 'REVOKED';
  invitationStatus: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'REJECTED' | 'NONE';
  permissions: TrustPermission[];
};
export type TrustMemberPayload = {
  name: string;
  email: string;
  phone?: string | null;
  relation: TrustRelation;
  customRelation?: string;
  dateOfBirth?: string | null;
  bloodGroup?: TrustBloodGroup | null;
  accessTypeCode: TrustAccess;
  permissions: TrustPermission[];
};

export const trustApi = {
  get: () => request<{ members: TrustMember[] }>('/api/trust', { requiresAuth: true }),
  add: (body: TrustMemberPayload) =>
    request<TrustMember>('/api/trust/family-members', { method: 'POST', body, requiresAuth: true }),
  update: (id: string, body: Partial<TrustMemberPayload>) =>
    request<TrustMember>(`/api/trust/members/${encodeURIComponent(id)}`, { method: 'PATCH', body, requiresAuth: true }),
  remove: (id: string) =>
    request<void>(`/api/trust/members/${encodeURIComponent(id)}`, { method: 'DELETE', requiresAuth: true }),
};
