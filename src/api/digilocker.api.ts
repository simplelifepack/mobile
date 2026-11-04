import { request } from './client';
export type DigiLockerStatus = {
  configured: boolean;
  environment?: 'sandbox' | 'production';
  supportedDocuments?: string[];
  message: string | null;
};
export type LockerDocument = {
  reference: string;
  name: string;
  type: string;
  issuer: string | null;
  issueDate: string | null;
  modifiedAt: string | null;
  mimeType: string;
  available: boolean;
  reason: string | null;
};
export type DigiLockerSession = {
  id: string;
  status: string;
  authorizationUrl?: string;
  expiresAt: string | null;
  progress?: Array<{
    reference: string;
    phase: string;
    message?: string;
    documentId?: string;
    duplicate?: boolean;
  }>;
};
const base = '/api/integrations/digilocker';
const auth = { requiresAuth: true, dedupeMs: 0, cacheMs: 0 };
export const digilockerApi = {
  status: () => request<DigiLockerStatus>(`${base}/status`, auth),
  start: () =>
    request<DigiLockerSession>(`${base}/sessions`, {
      ...auth,
      method: 'POST',
      body: {
        redirectUrl: 'readiness://digilocker',
        returnFormat: 'session-v1',
      },
    }),
  sessionStatus: (id: string) =>
    request<DigiLockerSession>(
      `${base}/sessions/${encodeURIComponent(id)}/status`,
      auth,
    ),
  documents: (id: string) =>
    request<{ documents: LockerDocument[]; session: DigiLockerSession }>(
      `${base}/sessions/${encodeURIComponent(id)}/documents`,
      auth,
    ),
  import: (id: string, references: string[]) =>
    request<DigiLockerSession>(
      `${base}/sessions/${encodeURIComponent(id)}/import`,
      {
        ...auth,
        method: 'POST',
        body: {
          references,
          consent: true,
          consentVersion: 'digilocker-copy-v1',
        },
      },
    ),
  cancel: (id: string) =>
    request<DigiLockerSession>(
      `${base}/sessions/${encodeURIComponent(id)}/cancel`,
      { ...auth, method: 'POST' },
    ),
};
