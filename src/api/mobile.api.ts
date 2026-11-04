import { normalizeGlobalSearchQuery } from './searchQuery';
import { request, downloadFile } from './client';
import { environment } from '../config/environment';
const API_URL = environment.apiUrl;
import { documentsApi } from './documents.api';
import { healthApi } from './health.api';
import type {
  AccountUsage,
  AdminCsvImportResult,
  AdminCsvPreview,
  AdminPackage,
  AdminPackageListResponse,
  AdminPackagePayload,
  AuthResponse,
  AuthUser,
  BootstrapResponse,
  CustomPackageGenerationJobResponse,
  CustomPackDraftResponse,
  CustomPackPayload,
  DynamicFormCategory,
  DynamicFormSchema,
  DynamicFormSubtype,
  DriveScanResult,
  DriveStatus,
  ForgotPasswordResponse,
  GmailCandidate,
  GmailImportResult,
  GmailStatus,
  GlobalSearchResponse,
  PackSummary,
  PackageListQuery,
  PackageListResponse,
  PackageLookup,
  PackageSearchOrGenerateResponse,
  ResetPasswordResponse,
  RequirementAssignmentSource,
  TrustCenterResponse,
  TrustInvitation,
  TrustMember,
  TrustMemberPayload,
  WealthHandoffSendResponse,
  WealthHandoffSummary,
  WealthRecord,
  WealthRecordPayload,
  WealthDynamicFormSubmitPayload,
} from './web.types';

export type * from './web.types';
export { API_URL };

function toQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const mobileApi = {
  auth: {
    requestSignupOtp: (payload: {
      name: string;
      email: string;
      password: string;
    }) =>
      request<ForgotPasswordResponse>('/auth/signup/request-otp', {
        method: 'POST',
        body: payload,
      }),
    signup: (payload: {
      name: string;
      email: string;
      password: string;
      otp: string;
    }) =>
      request<AuthResponse>('/auth/signup', { method: 'POST', body: payload }),
    login: (payload: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: payload }),
    loginWithPin: (payload: { email: string; pin: string }) =>
      request<AuthResponse>('/auth/login/pin', {
        method: 'POST',
        body: payload,
      }),
    google: (payload: { credential: string }) =>
      request<AuthResponse>('/auth/google', { method: 'POST', body: payload }),
    refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }),
    logout: () =>
      request<ForgotPasswordResponse>('/auth/logout', { method: 'POST' }),
    logoutAll: () =>
      request<ForgotPasswordResponse>('/auth/logout-all', {
        method: 'POST',
        requiresAuth: true,
      }),
    forgotPassword: (payload: { email: string }) =>
      request<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: payload,
      }),
    forgotPasswordOtp: (payload: { email: string }) =>
      request<ForgotPasswordResponse>('/auth/forgot-password/otp', {
        method: 'POST',
        body: payload,
      }),
    resetPassword: (payload: { token: string; password: string }) =>
      request<ResetPasswordResponse>('/auth/reset-password', {
        method: 'POST',
        body: payload,
      }),
    resetPasswordOtp: (payload: {
      email: string;
      otp: string;
      password: string;
    }) =>
      request<ResetPasswordResponse>('/auth/reset-password/otp', {
        method: 'POST',
        body: payload,
      }),
    requestEmailChange: (payload: {
      newEmail: string;
      currentPassword: string;
    }) =>
      request<ForgotPasswordResponse>('/auth/account/change-email/request', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    verifyEmailChange: (payload: { otp: string }) =>
      request<{ message: string; user: AuthUser }>(
        '/auth/account/change-email/verify',
        { method: 'POST', body: payload, requiresAuth: true },
      ),
    requestPasswordChange: (payload: {
      currentPassword: string;
      newPassword: string;
    }) =>
      request<ForgotPasswordResponse>('/auth/account/change-password/request', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    verifyPasswordChange: (payload: { otp: string }) =>
      request<ForgotPasswordResponse>('/auth/account/change-password/verify', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    setupPin: (payload: { pin: string }) =>
      request<{ message: string; user: AuthUser }>('/auth/account/pin/setup', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    changePin: (payload: { currentPin: string; newPin: string }) =>
      request<ForgotPasswordResponse>('/auth/account/pin/change', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    requestPinReset: () =>
      request<ForgotPasswordResponse>('/auth/account/pin/reset/request', {
        method: 'POST',
        requiresAuth: true,
      }),
    resetPin: (payload: { otp: string; newPin: string }) =>
      request<ForgotPasswordResponse>('/auth/account/pin/reset/verify', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    me: () => request<{ user: AuthUser }>('/auth/me', { requiresAuth: true }),
  },
  gmail: {
    status: (force = false) =>
      request<GmailStatus>('/api/integrations/gmail/status', {
        dedupeMs: force ? 0 : 2_000,
        requiresAuth: true,
      }),
    authorize: () =>
      request<{ authorizationUrl: string }>(
        '/api/integrations/gmail/authorize',
        { method: 'POST', requiresAuth: true },
      ),
    scan: (full = false) =>
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
    candidates: () =>
      request<{ candidates: GmailCandidate[] }>(
        '/api/integrations/gmail/candidates',
        { requiresAuth: true },
      ),
    dismiss: (id: string) =>
      request<void>(
        `/api/integrations/gmail/candidates/${encodeURIComponent(id)}/dismiss`,
        { method: 'POST', requiresAuth: true },
      ),
    import: (candidateIds: string[]) =>
      request<{ results: GmailImportResult[] }>(
        '/api/integrations/gmail/import',
        { method: 'POST', body: { candidateIds }, requiresAuth: true },
      ),
    disconnect: () =>
      request<void>('/api/integrations/gmail', {
        method: 'DELETE',
        requiresAuth: true,
      }),
  },
  drive: {
    status: () =>
      request<DriveStatus>('/api/integrations/drive/status', {
        dedupeMs: 5_000,
        requiresAuth: true,
      }),
    authorize: () =>
      request<{ authorizationUrl: string }>(
        '/api/integrations/drive/authorize',
        { method: 'POST', requiresAuth: true },
      ),
    scan: (
      full = false,
      duplicateAction: 'replace' | 'keep_both' | 'ignore' = 'ignore',
    ) =>
      request<DriveScanResult>('/api/integrations/drive/scan', {
        method: 'POST',
        body: { full, duplicateAction },
        requiresAuth: true,
      }),
    disconnect: () =>
      request<void>('/api/integrations/drive', {
        method: 'DELETE',
        requiresAuth: true,
      }),
  },
  documents: documentsApi,
  account: {
    requestExport: () =>
      request<{ id: string; status: string; expiresAt?: string | null }>(
        '/api/account/export',
        { method: 'POST', requiresAuth: true },
      ),
    exportStatus: (jobId: string) =>
      request<{
        id: string;
        status: string;
        expiresAt?: string | null;
        errorMessage?: string | null;
      }>(`/api/account/export/${encodeURIComponent(jobId)}`, {
        requiresAuth: true,
        dedupeMs: 0,
      }),
    downloadExport: (jobId: string) =>
      downloadFile(
        `/api/account/export/${encodeURIComponent(jobId)}/download`,
        { requiresAuth: true },
      ),
    scheduleDeletion: (phrase: string) =>
      request<{ message: string; scheduledDeletionAt: string }>(
        '/api/account/deletion',
        { method: 'POST', body: { phrase }, requiresAuth: true },
      ),
  },
  usage: () =>
    request<AccountUsage>('/api/bootstrap/usage', {
      requiresAuth: true,
      dedupeMs: 0,
    }),
  bootstrap: () =>
    request<BootstrapResponse>('/api/bootstrap', { requiresAuth: true }),
  search: (query: string, limit = 5, signal?: AbortSignal) =>
    request<GlobalSearchResponse>(
      `/api/search?${toQueryString({ q: normalizeGlobalSearchQuery(query), limit })}`,
      {
        requiresAuth: true,
        dedupeMs: 0,
        signal,
      },
    ),
  trust: {
    get: () =>
      request<TrustCenterResponse>('/api/trust', {
        requiresAuth: true,
        dedupeMs: 1_000,
      }),
    getInvitation: (token: string) =>
      request<TrustInvitation>(
        `/api/trust/invitations/${encodeURIComponent(token)}`,
      ),
    acceptInvitation: (token: string, pin: string) =>
      request<{ message: string }>(
        `/api/trust/invitations/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
          body: { pin },
        },
      ),
    rejectInvitation: (token: string) =>
      request<{ message: string }>(
        `/api/trust/invitations/${encodeURIComponent(token)}/reject`,
        { method: 'POST' },
      ),
    addMember: (payload: TrustMemberPayload) =>
      request<TrustMember>('/api/trust/members', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    addFamilyMember: (payload: TrustMemberPayload) =>
      request<TrustMember>('/api/trust/family-members', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    updateMember: (id: string, payload: Partial<TrustMemberPayload>) =>
      request<TrustMember>(`/api/trust/members/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: payload,
        requiresAuth: true,
      }),
    resendInvitation: (id: string) =>
      request<TrustMember>(
        `/api/trust/members/${encodeURIComponent(id)}/resend-invitation`,
        {
          method: 'POST',
          requiresAuth: true,
        },
      ),
    resetInvitationPin: (id: string, pin: string) =>
      request<TrustMember>(
        `/api/trust/members/${encodeURIComponent(id)}/reset-pin`,
        {
          method: 'POST',
          body: { pin },
          requiresAuth: true,
        },
      ),
    revokeMember: (id: string) =>
      request<void>(`/api/trust/members/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    leaveConnection: (id: string) =>
      request<void>(`/api/trust/connections/${encodeURIComponent(id)}/leave`, {
        method: 'POST',
        requiresAuth: true,
      }),
  },
  wealth: {
    records: (signal?: AbortSignal) =>
      request<WealthRecord[]>('/api/wealth/records', {
        timeoutMs: 15000,
        requiresAuth: true,
        cacheMs: 15000,
        signal,
      }),
    record: (id: string, signal?: AbortSignal) =>
      request<WealthRecord>(`/api/wealth/records/${encodeURIComponent(id)}`, {
        requiresAuth: true,
        dedupeMs: 2_000,
        timeoutMs: 15000,
        signal,
      }),
    createRecord: (payload: WealthRecordPayload) =>
      request<WealthRecord>('/api/wealth/records', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    updateRecord: (id: string, payload: WealthRecordPayload) =>
      request<WealthRecord>(`/api/wealth/records/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: payload,
        requiresAuth: true,
      }),
    deleteRecord: (id: string) =>
      request<void>(`/api/wealth/records/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    formCategories: () =>
      request<DynamicFormCategory[]>('/api/wealth/form/categories', {
        requiresAuth: true,
      }),
    formSubtypes: (categoryCode: string) =>
      request<DynamicFormSubtype[]>(
        `/api/wealth/form/categories/${encodeURIComponent(categoryCode)}/subtypes`,
        { requiresAuth: true },
      ),
    formSchema: (categoryCode: string, subtypeCode: string) =>
      request<DynamicFormSchema>(
        `/api/wealth/form/categories/${encodeURIComponent(categoryCode)}/subtypes/${encodeURIComponent(subtypeCode)}/schema`,
        { requiresAuth: true },
      ),
    createRecordFromForm: (payload: WealthDynamicFormSubmitPayload) =>
      request<WealthRecord>('/api/wealth/form/records', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    handoffSummary: () =>
      request<WealthHandoffSummary>('/api/wealth/handoff/summary', {
        requiresAuth: true,
      }),
    sendHandoff: (payload: {
      familyRecipientIds: string[];
      emergencyRecipientIds: string[];
    }) =>
      request<WealthHandoffSendResponse>('/api/wealth/handoff/send', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
  },
  health: healthApi,
  packages: {
    list: (query: PackageListQuery = {}, signal?: AbortSignal) =>
      request<PackageListResponse>(
        `/api/packages?${toQueryString({
          category: query.category,
          limit: query.limit ?? 20,
          location: query.location,
          page: query.page ?? 1,
          provider: query.provider,
          search: query.search?.slice(0, 160),
          sort: query.sort,
        })}`,
        { requiresAuth: true, cacheMs: 60_000, signal },
      ),
    get: (slug: string) =>
      request<PackSummary>(`/api/packages/${encodeURIComponent(slug)}`, {
        requiresAuth: true,
      }),
    refresh: (slug: string) =>
      request<{
        package: PackSummary;
        changed: boolean;
        message: string;
        refreshed?: boolean;
      }>(`/api/packages/${encodeURIComponent(slug)}/refresh`, {
        method: 'POST',
        requiresAuth: true,
      }),
    searchOrGenerate: (packageType: string, documentLabels: string[]) =>
      request<PackageSearchOrGenerateResponse>(
        '/api/packages/search-or-generate',
        {
          method: 'POST',
          body: { packageType, documentLabels },
          requiresAuth: true,
        },
      ),
    draftCustom: (packageType: string, documentLabels: string[]) =>
      request<CustomPackDraftResponse>('/api/packages/custom/draft', {
        method: 'POST',
        body: { packageType, documentLabels },
        requiresAuth: true,
      }),
    createCustomGenerationJob: (
      packageType: string,
      documentLabels: string[],
    ) =>
      request<CustomPackageGenerationJobResponse>(
        '/api/packages/custom/generation-jobs',
        {
          method: 'POST',
          body: { packageType, documentLabels },
          requiresAuth: true,
        },
      ),
    getCustomGenerationJob: (jobId: string) =>
      request<CustomPackageGenerationJobResponse>(
        `/api/packages/custom/generation-jobs/${encodeURIComponent(jobId)}`,
        { requiresAuth: true },
      ),
    createCustom: (payload: CustomPackPayload) =>
      request<{ package: PackSummary }>('/api/packages/custom', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    updateCustom: (slug: string, payload: CustomPackPayload) =>
      request<{ package: PackSummary }>(
        `/api/packages/${encodeURIComponent(slug)}/custom`,
        { method: 'PATCH', body: payload, requiresAuth: true },
      ),
    deleteCustom: (slug: string) =>
      request<void>(`/api/packages/${encodeURIComponent(slug)}/custom`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    getByIds: (ids: string[]) =>
      request<PackageLookup[]>(
        `/packages?ids=${encodeURIComponent(ids.join(','))}`,
        { requiresAuth: true },
      ),
    assignRequirementDocument: (
      slug: string,
      requirementId: string,
      payload: {
        documentId: string;
        assignmentSource: Exclude<RequirementAssignmentSource, 'AUTO'>;
      },
    ) =>
      request<{ package: PackSummary }>(
        `/api/packages/${encodeURIComponent(slug)}/requirements/${encodeURIComponent(requirementId)}/assignment`,
        {
          method: 'POST',
          body: payload,
          requiresAuth: true,
        },
      ),
    clearRequirementDocument: (slug: string, requirementId: string) =>
      request<{ package: PackSummary }>(
        `/api/packages/${encodeURIComponent(slug)}/requirements/${encodeURIComponent(requirementId)}/assignment`,
        {
          method: 'DELETE',
          requiresAuth: true,
        },
      ),
  },
  adminPackages: {
    list: (
      query: {
        category?: string;
        limit?: number;
        page?: number;
        search?: string;
      } = {},
    ) =>
      request<AdminPackageListResponse>(
        `/api/admin/packages?${toQueryString({
          category: query.category,
          limit: query.limit ?? 25,
          page: query.page ?? 1,
          search: query.search?.slice(0, 160),
        })}`,
        { requiresAuth: true, dedupeMs: 0 },
      ),
    get: (slug: string) =>
      request<AdminPackage>(`/api/admin/packages/${encodeURIComponent(slug)}`, {
        requiresAuth: true,
        dedupeMs: 0,
      }),
    create: (payload: AdminPackagePayload) =>
      request<{ package: AdminPackage }>('/api/admin/packages', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    update: (slug: string, payload: AdminPackagePayload) =>
      request<{ package: AdminPackage }>(
        `/api/admin/packages/${encodeURIComponent(slug)}`,
        { method: 'PATCH', body: payload, requiresAuth: true },
      ),
    delete: (slug: string) =>
      request<void>(`/api/admin/packages/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    previewCsv: (csv: string) =>
      request<AdminCsvPreview>('/api/admin/packages/import/preview', {
        method: 'POST',
        body: { csv },
        requiresAuth: true,
      }),
    importCsv: (csv: string) =>
      request<AdminCsvImportResult>('/api/admin/packages/import', {
        method: 'POST',
        body: { csv },
        requiresAuth: true,
      }),
    downloadTemplate: () =>
      downloadFile('/api/admin/packages/template.csv', { requiresAuth: true }),
  },
};
