import { downloadToFile, request, uploadMultipart } from './client';
import { Dirs } from 'react-native-file-access';
import type {
  DocumentAnalysisResponse,
  DocumentRecord,
  DocumentSavePayload,
  DocumentSaveResponse,
  EncryptedDocumentEnvelope,
  PublicDocumentEncryptionKey,
} from './types';

function extensionForMimeType(mimeType: string) {
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/jpeg') return '.jpg';
  return '.bin';
}

export const documentsApi = {
  list: () => request<DocumentRecord[]>('/documents', { requiresAuth: true }),
  getEncryptionKey: () =>
    request<PublicDocumentEncryptionKey>('/documents/encryption-key', {
      requiresAuth: true,
    }),
  analyzeEncrypted: (
    files: Array<{ uri: string; name: string }>,
    envelopes: EncryptedDocumentEnvelope[],
  ) =>
    uploadMultipart<DocumentAnalysisResponse>(
      '/documents/analyze',
      {
        envelopes: JSON.stringify(envelopes),
        aiAnalysisConsent: String(
          envelopes.some(item => item.aiAnalysisConsent),
        ),
      },
      files.map(file => ({
        fieldName: 'encryptedFiles',
        uri: file.uri,
        name: file.name,
        mimeType: 'application/octet-stream',
      })),
    ),
  save: (payload: DocumentSavePayload) =>
    request<DocumentSaveResponse>('/documents', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  getById: (id: string) =>
    request<DocumentRecord>(`/documents/${encodeURIComponent(id)}`, {
      requiresAuth: true,
    }),
  preview: (id: string, mimeType: string) =>
    downloadToFile(
      `/documents/${encodeURIComponent(id)}/preview`,
      `${Dirs.CacheDir}/readiness-preview-${Date.now()}${extensionForMimeType(mimeType)}`,
    ),
  previewPage: (id: string, pageId: string, mimeType: string) =>
    downloadToFile(
      `/documents/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}/preview`,
      `${Dirs.CacheDir}/readiness-preview-${Date.now()}${extensionForMimeType(mimeType)}`,
    ),
  delete: (id: string) =>
    request<void>(`/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  bulkDelete: (ids: string[]) =>
    request<void>('/documents/bulk-delete', {
      method: 'POST',
      body: { ids },
      requiresAuth: true,
    }),
};
