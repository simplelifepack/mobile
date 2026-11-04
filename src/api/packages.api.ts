import { publicDocumentLabels } from './public-document-labels';
import { request } from './client';
import type {
  PackageListResponse,
  PackageSearchResponse,
  PackageSummary,
} from './types';

export type PackageQuery = {
  category?: string;
  limit?: number;
  page?: number;
  search?: string;
};

function queryString(query: PackageQuery) {
  return Object.entries({
    ...query,
    limit: query.limit ?? 20,
    page: query.page ?? 1,
    sort: query.search
      ? 'relevance'
      : query.category === 'My packs'
        ? 'newest'
        : 'category',
  })
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

export const packagesApi = {
  list: (query: PackageQuery = {}, force = false, signal?: AbortSignal) =>
    request<PackageListResponse>(`/api/packages?${queryString(query)}`, {
      requiresAuth: true,
      cacheMs: force ? 0 : 60000,
      signal,
    }),
  get: (slug: string, force = false, signal?: AbortSignal) =>
    request<PackageSummary>(`/api/packages/${encodeURIComponent(slug)}`, {
      requiresAuth: true,
      cacheMs: force ? 0 : 60000,
      signal,
    }),
  searchOrGenerate: (packageType: string, documentLabels: string[]) =>
    request<PackageSearchResponse>('/api/packages/search-or-generate', {
      method: 'POST',
      body: {
        packageType,
        documentLabels: publicDocumentLabels(documentLabels),
      },
      requiresAuth: true,
    }),
};
