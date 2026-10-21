import { Dirs } from 'react-native-file-access';
import { downloadToFile, request } from './client';

export type ExportJob = {
  id: string;
  status: string;
  expiresAt?: string | null;
  errorMessage?: string | null;
};

export type AccountUsage = {
  accountTier: 'free' | 'paid';
  storage: {
    usedBytes: number;
    limitBytes: number | null;
    unlimited: boolean;
  };
  aiUsage: {
    used: number | null;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    period: string;
  };
};

export const accountApi = {
  usage: () =>
    request<AccountUsage>('/api/bootstrap/usage', {
      requiresAuth: true,
    }),
  requestExport: () =>
    request<ExportJob>('/api/account/export', {
      method: 'POST',
      requiresAuth: true,
    }),
  exportStatus: (jobId: string) =>
    request<ExportJob>(`/api/account/export/${encodeURIComponent(jobId)}`, {
      requiresAuth: true,
    }),
  downloadExport: (jobId: string) =>
    downloadToFile(
      `/api/account/export/${encodeURIComponent(jobId)}/download`,
      `${Dirs.CacheDir}/readiness-export-${Date.now()}.zip`,
    ),
  scheduleDeletion: (phrase: string) =>
    request<{ message: string; scheduledDeletionAt: string }>(
      '/api/account/deletion',
      { method: 'POST', body: { phrase }, requiresAuth: true },
    ),
};
