import { normalizeDocument } from './normalizeDocument';
import { request } from './client';
import type { BootstrapResponse } from './types';
export const userApi = {
  bootstrap: async (): Promise<BootstrapResponse> => {
    const [account, documents] = await Promise.all([
      request<Omit<BootstrapResponse, 'documents' | 'savedPackages'>>(
        '/api/bootstrap',
        { requiresAuth: true },
      ),
      request<BootstrapResponse['documents']>('/documents', {
        requiresAuth: true,
      }),
    ]);
    return {
      ...account,
      documents: documents.map(normalizeDocument),
      savedPackages: [],
    };
  },
};
