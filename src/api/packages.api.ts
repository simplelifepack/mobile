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
    sort: 'category',
  })
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

export const packagesApi = {
  list: (query: PackageQuery = {}) =>
    request<PackageListResponse>(`/api/packages?${queryString(query)}`, {
      requiresAuth: true,
    }),
  get: (slug: string) =>
    request<PackageSummary>(`/api/packages/${encodeURIComponent(slug)}`, {
      requiresAuth: true,
    }),
  searchOrGenerate: (packageType: string, documentLabels: string[]) =>
    request<PackageSearchResponse>('/api/packages/search-or-generate', {
      method: 'POST',
      body: { packageType, documentLabels },
      requiresAuth: true,
    }),
};
