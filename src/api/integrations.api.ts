import { request } from './client';

export type GmailStatus = {
  connected: boolean;
  account: string | null;
  lastScannedAt: string | null;
  scanning: boolean;
};

export type GmailCandidate = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  sender: string;
  subject: string;
  receivedAt: string;
  suggestedCategory: string;
  suggestedDocumentType: string;
  relevanceReason: string;
  relevanceScore: number;
  legitimacyReason: string;
  legitimacyScore: number;
  reviewRequired: boolean;
  status: string;
};

export type DriveStatus = {
  connected: boolean;
  account: string | null;
  scanStatus: 'idle' | 'scanning' | 'completed' | 'failed';
  lastScannedAt: string | null;
  lastSuccessfulSync: string | null;
  scanning: boolean;
  phase: string | null;
  processed: number;
  total: number;
  indexedCount: number;
  error: string | null;
};

export const integrationsApi = {
  gmailStatus: () =>
    request<GmailStatus>('/api/integrations/gmail/status', {
      requiresAuth: true,
    }),
  gmailAuthorize: () =>
    request<{ authorizationUrl: string }>('/api/integrations/gmail/authorize', {
      method: 'POST',
      requiresAuth: true,
    }),
  gmailScan: (full = false) =>
    request<{
      discovered: number;
      relevant: number;
      needsReview: number;
      ignored: number;
      lastScannedAt: string;
    }>('/api/integrations/gmail/scan', {
      method: 'POST',
      body: { full },
      requiresAuth: true,
    }),
  gmailCandidates: () =>
    request<{ candidates: GmailCandidate[] }>(
      '/api/integrations/gmail/candidates',
      { requiresAuth: true },
    ),
  dismissGmailCandidate: (id: string) =>
    request<void>(
      `/api/integrations/gmail/candidates/${encodeURIComponent(id)}/dismiss`,
      { method: 'POST', requiresAuth: true },
    ),
  importGmailCandidates: (candidateIds: string[]) =>
    request<{ results: Array<{ candidateId: string; status: string; message?: string }> }>(
      '/api/integrations/gmail/import',
      { method: 'POST', body: { candidateIds }, requiresAuth: true },
    ),
  disconnectGmail: () =>
    request<void>('/api/integrations/gmail', {
      method: 'DELETE',
      requiresAuth: true,
    }),
  driveStatus: () =>
    request<DriveStatus>('/api/integrations/drive/status', {
      requiresAuth: true,
    }),
  driveAuthorize: () =>
    request<{ authorizationUrl: string }>('/api/integrations/drive/authorize', {
      method: 'POST',
      requiresAuth: true,
    }),
  driveScan: (
    full = false,
    duplicateAction: 'replace' | 'keep_both' | 'ignore' = 'ignore',
  ) =>
    request<Record<string, unknown>>('/api/integrations/drive/scan', {
      method: 'POST',
      body: { full, duplicateAction },
      requiresAuth: true,
    }),
  disconnectDrive: () =>
    request<void>('/api/integrations/drive', {
      method: 'DELETE',
      requiresAuth: true,
    }),
};
