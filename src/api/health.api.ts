import { request } from './client';

export type HealthMember = {
  id: string;
  name: string;
  relation: string;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  conditions?: string | null;
  allergies?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  primaryDoctor?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthMeasurement = {
  id: string;
  sourceDocumentId: string | null;
  recordId: string | null;
  metricKey: string;
  displayName: string;
  originalName: string;
  value: number;
  secondaryValue?: number | null;
  unit: string;
  context?: string | null;
  bodySite?: string | null;
  referenceMin?: number | null;
  referenceMax?: number | null;
  referenceText?: string | null;
  measuredAt: string | null;
  sourceType: string;
  isTracked?: boolean;
  aliases?: string[];
};

export type HealthRecord = {
  id: string;
  memberId: string;
  documentId: string;
  type: 'lab_report' | 'medical_report' | 'prescription';
  documentDate: string | null;
  provider?: string | null;
  doctor?: string | null;
  processingStatus: string;
  processingError?: string | null;
  measurementCount: number;
  trackedMeasurementCount: number;
  medicationCount: number;
  followUpCount: number;
  createdAt: string;
  processedAt?: string | null;
};

export type HealthHomeReminder = {
  id: string;
  title: string;
  dueDate: string | null;
  memberId?: string;
  memberName: string;
  origin: string;
};

export type MedicationTime = 'morning' | 'afternoon' | 'night';
export type MealTiming = 'before_food' | 'after_food' | 'with_food' | 'any_time';

export type HealthMedication = {
  id: string;
  memberId: string;
  name: string;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: string | null;
  status: 'continuing' | 'stopped' | string;
  repeats: boolean;
  runsOutAt?: string | null;
  stoppedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type TrackedHealthMetric = {
  id: string;
  memberId: string;
  metricKey: string;
  displayName: string;
  context?: string | null;
  bodySite?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HealthAvailableMetric = {
  metricKey: string;
  displayName: string;
  context?: string | null;
  bodySite?: string | null;
  historicalReadingCount: number;
  isTracked: boolean;
  latestValue: number;
  secondaryValue?: number | null;
  unit: string;
};

export type HealthTimelineEvent = {
  id: string;
  eventType: 'measurement' | 'medication';
  recordId?: string | null;
  occurredAt: string | null;
  title: string;
  value?: number;
  secondaryValue?: number | null;
  unit?: string;
  detail?: string | null;
  source: string;
  sourceType: string;
  medication?: HealthMedication;
};

export type HealthOverview = {
  member: HealthMember;
  upcoming: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    origin: string;
    status: string;
    sourceDocumentId?: string | null;
  }>;
  trackedMetrics: Array<
    TrackedHealthMetric & {
      measurements: HealthMeasurement[];
      latest: HealthMeasurement | null;
    }
  >;
  recentRecords: HealthRecord[];
};

export type HealthRecordDetail = HealthRecord & {
  measurements: HealthMeasurement[];
  medications: HealthMedication[];
  followUps: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    explicitDate?: string | null;
    sourceText?: string | null;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    origin: string;
    status: string;
  }>;
};

export type HealthMemberResolution = {
  type: 'lab_report' | 'medical_report' | 'prescription';
  documentId: string;
  processingStatus: 'awaiting_profile_match';
  patient: { name?: string | null } | null;
  memberMatch: {
    status: 'matched' | 'unmatched' | 'ambiguous' | string;
    candidates: Array<{ id: string; name: string }>;
  };
};

export function isMemberResolution(
  response: HealthRecordDetail | HealthMemberResolution,
): response is HealthMemberResolution {
  return response.processingStatus === 'awaiting_profile_match';
}

export const healthApi = {
  reminders: () =>
    request<HealthHomeReminder[]>('/api/health/reminders', {
      requiresAuth: true,
    }),
  createReminder: (payload: {
    memberId: string;
    title: string;
    dueDate: string;
    type?: string;
    frequency?: string;
  }) =>
    request<HealthHomeReminder>('/api/health/reminders', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  members: () =>
    request<HealthMember[]>('/api/health/members', { requiresAuth: true }),
  createMember: (payload: {
    name: string;
    relation: string;
    bloodGroup?: string | null;
    dateOfBirth?: string | null;
  }) =>
    request<HealthMember>('/api/health/members', {
      method: 'POST',
      body: payload,
      requiresAuth: true,
    }),
  updateMember: (memberId: string, payload: Partial<HealthMember>) =>
    request<HealthMember>(
      `/api/health/members/${encodeURIComponent(memberId)}`,
      { method: 'PATCH', body: payload, requiresAuth: true },
    ),
  deleteMember: (memberId: string) =>
    request<void>(`/api/health/members/${encodeURIComponent(memberId)}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  overview: (memberId: string) =>
    request<HealthOverview>(
      `/api/health/members/${encodeURIComponent(memberId)}/overview`,
      { requiresAuth: true },
    ),
  records: (memberId: string) =>
    request<HealthRecord[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/records`,
      { requiresAuth: true },
    ),
  createRecord: (payload: {
    memberId?: string;
    documentId: string;
    type?: 'lab_report' | 'medical_report' | 'prescription';
  }) =>
    request<HealthRecordDetail | HealthMemberResolution>(
      '/api/health/records',
      { method: 'POST', body: payload, requiresAuth: true },
    ),
  updateRecord: (
    recordId: string,
    payload: { type?: 'lab_report' | 'medical_report' | 'prescription' },
  ) =>
    request<HealthRecordDetail>(
      `/api/health/records/${encodeURIComponent(recordId)}`,
      { method: 'PATCH', body: payload, requiresAuth: true },
    ),
  record: (recordId: string) =>
    request<HealthRecordDetail>(
      `/api/health/records/${encodeURIComponent(recordId)}`,
      { requiresAuth: true },
    ),
  deleteRecord: (recordId: string) =>
    request<void>(`/api/health/records/${encodeURIComponent(recordId)}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
  measurements: (memberId: string, metric?: string) =>
    request<HealthMeasurement[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/measurements${metric ? `?metric=${encodeURIComponent(metric)}` : ''}`,
      { requiresAuth: true },
    ),
  createMeasurement: (
    memberId: string,
    payload: {
      metricKey: string;
      displayName: string;
      originalName?: string;
      value: number;
      secondaryValue?: number | null;
      unit: string;
      context?: string | null;
      bodySite?: string | null;
      referenceMin?: number | null;
      referenceMax?: number | null;
      referenceText?: string | null;
      measuredAt: string;
    },
  ) =>
    request<HealthMeasurement>(
      `/api/health/members/${encodeURIComponent(memberId)}/measurements`,
      { method: 'POST', body: payload, requiresAuth: true },
    ),
  trackedMetrics: (memberId: string) =>
    request<TrackedHealthMetric[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics`,
      { requiresAuth: true },
    ),
  trackMetric: (
    memberId: string,
    payload: {
      metricKey: string;
      displayName: string;
      context?: string | null;
      bodySite?: string | null;
    },
  ) =>
    request<TrackedHealthMetric>(
      `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics`,
      { method: 'POST', body: payload, requiresAuth: true },
    ),
  untrackMetric: (memberId: string, trackedId: string) =>
    request<void>(
      `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics/${encodeURIComponent(trackedId)}`,
      { method: 'DELETE', requiresAuth: true },
    ),
  availableMetrics: (memberId: string, search = '') =>
    request<HealthAvailableMetric[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/available-metrics?search=${encodeURIComponent(search)}`,
      { requiresAuth: true },
    ),
  timeline: (memberId: string) =>
    request<HealthTimelineEvent[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/timeline`,
      { requiresAuth: true },
    ),
  createMedication: (
    memberId: string,
    payload: {
      name: string;
      dose: string;
      whenToTake: MedicationTime[];
      mealTiming: MealTiming;
      repeatRunsOut?: string | null;
    },
  ) =>
    request<HealthMedication>(
      `/api/health/members/${encodeURIComponent(memberId)}/medications`,
      { method: 'POST', body: payload, requiresAuth: true },
    ),
  updateMedication: (
    medicationId: string,
    payload: Partial<
      Pick<HealthMedication, 'name' | 'dose' | 'frequency' | 'duration' | 'quantity' | 'repeats' | 'runsOutAt' | 'status' | 'stoppedAt'>
    >,
  ) =>
    request<HealthMedication>(
      `/api/health/medications/${encodeURIComponent(medicationId)}`,
      { method: 'PATCH', body: payload, requiresAuth: true },
    ),
  deleteMedication: (medicationId: string) =>
    request<void>(`/api/health/medications/${encodeURIComponent(medicationId)}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),
};
