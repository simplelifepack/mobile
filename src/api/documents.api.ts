import { normalizeDocument } from './normalizeDocument';
import {
  sendEncryptedDocuments,
  type PickedDocument,
} from '../native/documentFiles';
import { downloadFile, request } from './client';
import type {
  AnalyzeDocumentResponse,
  DocumentRecord,
  SaveDocumentPayload,
  UploadDocumentResponse,
} from './web.types';

function normalizeResponse(result: { document: DocumentRecord }) {
  return { ...result, document: normalizeDocument(result.document) };
}
async function documentRequest(
  path: string,
  options: Parameters<typeof request>[1],
) {
  return normalizeResponse(
    await request<{ document: DocumentRecord }>(path, options),
  );
}

export const documentsApi = {
  updateDetails: (
    id: string,
    details: { notes?: string; expiry?: string | null },
  ) =>
    documentRequest(`/documents/${encodeURIComponent(id)}/details`, {
      method: 'PATCH',
      body: details,
      requiresAuth: true,
    }),
  assignmentOptions: (signal?: AbortSignal) =>
    request<Array<{ id: string; name: string }>>(
      '/documents/assignment-options',
      { requiresAuth: true, cacheMs: 30_000, signal },
    ),
  bulkAssign: (ids: string[], assigneeId: string) =>
    request<{ documents: DocumentRecord[] }>('/documents/bulk-assign', {
      method: 'POST',
      body: { ids, assigneeId },
      requiresAuth: true,
    }),
  list: async (signal?: AbortSignal) =>
    (
      await request<DocumentRecord[]>('/documents', {
        requiresAuth: true,
        cacheMs: 15000,
        signal,
      })
    ).map(normalizeDocument),
  getById: async (id: string, signal?: AbortSignal) =>
    normalizeDocument(
      await request<DocumentRecord>(`/documents/${encodeURIComponent(id)}`, {
        requiresAuth: true,
        cacheMs: 30000,
        signal,
      }),
    ),
  preview: (id: string) =>
    downloadFile(`/documents/${encodeURIComponent(id)}/preview`, {
      requiresAuth: true,
      cacheMs: 300000,
    }),
  download: (id: string) =>
    downloadFile(`/documents/${encodeURIComponent(id)}/download`, {
      requiresAuth: true,
      cacheMs: 300000,
    }),
  bulkDownload: (ids: string[]) =>
    downloadFile('/documents/bulk-download', {
      method: 'POST',
      body: { ids },
      requiresAuth: true,
    }),
  analyze: (files: PickedDocument[], aiAnalysisConsent = false) =>
    sendEncryptedDocuments<AnalyzeDocumentResponse>(
      '/documents/analyze',
      files,
      aiAnalysisConsent,
    ),
  save: (payload: SaveDocumentPayload) =>
    documentRequest('/documents', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  upload: (files: PickedDocument[], aiAnalysisConsent = false) =>
    sendEncryptedDocuments<UploadDocumentResponse>(
      '/documents/upload',
      files,
      aiAnalysisConsent,
    ),
  addPageFiles: (id: string, files: PickedDocument[]) =>
    sendEncryptedDocuments<{ document: DocumentRecord }>(
      `/documents/${encodeURIComponent(id)}/pages`,
      files,
    ).then(normalizeResponse),
  reorderPages: (id: string, pageIds: string[]) =>
    documentRequest(`/documents/${encodeURIComponent(id)}/pages/order`, {
      method: 'PATCH',
      body: { pageIds },
      requiresAuth: true,
    }),
  replacePage: (id: string, pageId: string, tempFileId: string) =>
    documentRequest(
      `/documents/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}`,
      { method: 'PATCH', body: { tempFileId }, requiresAuth: true },
    ),
  deletePage: (id: string, pageId: string) =>
    documentRequest(
      `/documents/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}`,
      { method: 'DELETE', requiresAuth: true },
    ),
  previewPage: (id: string, pageId: string) =>
    downloadFile(
      `/documents/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}/preview`,
      { requiresAuth: true, cacheMs: 300000 },
    ),
  downloadPage: (id: string, pageId: string) =>
    downloadFile(
      `/documents/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageId)}/download`,
      { requiresAuth: true },
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
