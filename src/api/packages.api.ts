import { request } from './client';
import type {
  PackageListResponse,
  PackageSearchResponse,
  PackageSummary,
  RequirementAssignmentSource,
  CustomPackPayload,
  CustomPackDraftResponse,
  CustomPackageGenerationJobResponse,
} from './types';
import { publicDocumentLabels } from './publicDocumentLabels';

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
    request<PackageListResponse>(`/api/packages?${queryString({
      ...query,
      search: query.search?.slice(0, 160),
    })}`, {
      requiresAuth: true,
    }),
  get: (slug: string) =>
    request<PackageSummary>(`/api/packages/${encodeURIComponent(slug)}`, {
      requiresAuth: true,
    }),
  createCustom: (payload: CustomPackPayload) =>
    request<{ package: PackageSummary }>('/api/packages/custom', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  draftCustom: (packageType: string, documentLabels: string[]) =>
    request<CustomPackDraftResponse>('/api/packages/custom/draft', {
      method: 'POST',
      body: { packageType, documentLabels: publicDocumentLabels(documentLabels) },
      requiresAuth: true,
    }),
  createCustomGenerationJob: (packageType: string, documentLabels: string[]) =>
    request<CustomPackageGenerationJobResponse>('/api/packages/custom/generation-jobs', {
      method: 'POST',
      body: { packageType, documentLabels: publicDocumentLabels(documentLabels) },
      requiresAuth: true,
    }),
  getCustomGenerationJob: (jobId: string) =>
    request<CustomPackageGenerationJobResponse>(
      `/api/packages/custom/generation-jobs/${encodeURIComponent(jobId)}`,
      { requiresAuth: true },
    ),
  updateCustom: (slug: string, payload: CustomPackPayload) =>
    request<{ package: PackageSummary }>(
      `/api/packages/${encodeURIComponent(slug)}/custom`,
      { method: 'PATCH', body: payload, requiresAuth: true },
    ),
  deleteCustom: (slug: string) =>
    request<void>(`/api/packages/${encodeURIComponent(slug)}/custom`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  searchOrGenerate: (packageType: string, documentLabels: string[]) =>
    request<PackageSearchResponse>('/api/packages/search-or-generate', {
      method: 'POST',
      body: { packageType, documentLabels: publicDocumentLabels(documentLabels) },
      requiresAuth: true,
    }),
  refresh: (slug: string) =>
    request<{
      package: PackageSummary;
      changed: boolean;
      message: string;
      refreshed?: boolean;
    }>(`/api/packages/${encodeURIComponent(slug)}/refresh`, {
      method: 'POST',
      requiresAuth: true,
    }),
  assignRequirementDocument: (
    slug: string,
    requirementId: string,
    documentId: string,
    assignmentSource: Exclude<RequirementAssignmentSource, 'AUTO'>,
  ) =>
    request<{ package: PackageSummary }>(
      `/api/packages/${encodeURIComponent(slug)}/requirements/${encodeURIComponent(requirementId)}/assignment`,
      {
        method: 'POST',
        body: { documentId, assignmentSource },
        requiresAuth: true,
      },
    ),
  clearRequirementDocument: (slug: string, requirementId: string) =>
    request<{ package: PackageSummary }>(
      `/api/packages/${encodeURIComponent(slug)}/requirements/${encodeURIComponent(requirementId)}/assignment`,
      { method: 'DELETE', requiresAuth: true },
    ),
};
