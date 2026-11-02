import { request } from './client';

export type LockerDocument = {
  reference: string;
  name: string;
  type: string;
  issuer: string | null;
  issueDate: string | null;
  modifiedAt: string | null;
  available: boolean;
  reason: string | null;
};

export type LockerProgress = {
  reference: string;
  phase: string;
  documentId?: string;
  duplicate?: boolean;
  message?: string;
};

export type LockerSessionStatus =
  | 'PENDING'
  | 'AUTHENTICATED'
  | 'IMPORTING'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONSENT_DENIED'
  | 'FAILED';

export type LockerSession = {
  id: string;
  status: LockerSessionStatus;
  expiresAt: string | null;
  progress: LockerProgress[];
};

export const DIGILOCKER_CONSENT_VERSION = 'digilocker-copy-v1';
export const DIGILOCKER_REDIRECT_URL = 'readiness://digilocker';

const base = '/api/integrations/digilocker';
const sessionPath = (id: string) => `${base}/sessions/${encodeURIComponent(id)}`;

export const digilockerApi = {
  status: () =>
    request<{ configured: boolean; message: string | null }>(`${base}/status`, {
      requiresAuth: true,
    }),
  start: () =>
    request<LockerSession & { authorizationUrl: string }>(`${base}/sessions`, {
      method: 'POST',
      body: { redirectUrl: DIGILOCKER_REDIRECT_URL, returnFormat: 'session-v1' },
      requiresAuth: true,
    }),
  session: (id: string) =>
    request<LockerSession>(`${sessionPath(id)}/status`, { requiresAuth: true }),
  documents: (id: string) =>
    request<{ documents: LockerDocument[]; session: LockerSession }>(
      `${sessionPath(id)}/documents`,
      { requiresAuth: true },
    ),
  cancel: (id: string) =>
    request<LockerSession>(`${sessionPath(id)}/cancel`, {
      method: 'POST',
      requiresAuth: true,
    }),
  import: (id: string, references: string[]) =>
    request<LockerSession>(`${sessionPath(id)}/import`, {
      method: 'POST',
      body: {
        references,
        consent: true,
        consentVersion: DIGILOCKER_CONSENT_VERSION,
      },
      requiresAuth: true,
    }),
};
