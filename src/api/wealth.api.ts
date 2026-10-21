import { request } from './client';

export type WealthRecordType =
  | 'ASSET'
  | 'LOAN_TAKEN'
  | 'LOAN_GIVEN'
  | 'INSURANCE'
  | 'PAYMENT_PROOF';

export type WealthRecordPayload = {
  type: WealthRecordType;
  title: string;
  details: Record<string, string | number | boolean | null | string[]>;
  notes?: string;
  followUpDate?: string | null;
  followUpNote?: string;
  attachmentDocumentIds: string[];
};

export type WealthRecord = WealthRecordPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
  attachments: Array<{
    id: string;
    documentId: string;
    originalName: string;
    title?: string | null;
    category: string;
    mimeType: string;
    size: number;
  }>;
  loanBreakdown?: {
    principal: number;
    interest: number;
    payments: number;
    outstanding: number;
    monthsElapsed: number;
    calculationType: string;
  } | null;
};

export type DynamicFormCategory = {
  code: string;
  label: string;
  description?: string | null;
};

export type DynamicFormField = {
  id: string;
  label: string;
  inputType: string;
  required: boolean;
  placeholder?: string | null;
  defaultValue?: string | number | boolean | null;
  options?: Array<string | { label: string; value: string }> | null;
  group?: string | null;
  order: number;
};

export type DynamicFormSchema = {
  category: DynamicFormCategory;
  subtype: DynamicFormCategory;
  fields: DynamicFormField[];
};

export type WealthHandoffRecipient = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  accessType: 'VIEW_ONLY' | 'FAMILY_MEMBER' | 'EMERGENCY_ACCESS';
  accessTypeLabel: string;
  canReceiveHandoff: boolean;
  verificationStatus: 'verified';
  type: 'family' | 'emergency' | 'other';
};

export type WealthHandoffSummary = {
  generatedAt: string;
  recipients: {
    family: WealthHandoffRecipient[];
    emergency: WealthHandoffRecipient[];
    other?: WealthHandoffRecipient[];
  };
  handoffTypes: Array<{
    type: 'family' | 'emergency';
    label: string;
    contents: string[];
    excluded: string[];
    counts: {
      assets: number;
      insurance: number;
      loans: number;
      financialRecords: number;
      documents: number;
      images: number;
    };
  }>;
};

export type WealthHandoffSendResponse = {
  message: string;
  results: Array<{
    recipientId: string;
    email: string;
    handoffType: 'family' | 'emergency';
    sent: boolean;
    messageId?: string | null;
    reason?: 'email_disabled' | 'invalid_recipient' | 'delivery_failed';
    errorCode?: string;
  }>;
};

export const wealthApi = {
  records: () =>
    request<WealthRecord[]>('/api/wealth/records', { requiresAuth: true }),
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
    request<DynamicFormCategory[]>(
      `/api/wealth/form/categories/${encodeURIComponent(categoryCode)}/subtypes`,
      { requiresAuth: true },
    ),
  formSchema: (categoryCode: string, subtypeCode: string) =>
    request<DynamicFormSchema>(
      `/api/wealth/form/categories/${encodeURIComponent(categoryCode)}/subtypes/${encodeURIComponent(subtypeCode)}/schema`,
      { requiresAuth: true },
    ),
  createRecordFromForm: (payload: {
    categoryCode: string;
    subtypeCode: string;
    values: Record<string, string | number | boolean | null | string[]>;
  }) =>
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
};
