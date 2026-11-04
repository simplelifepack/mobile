import { request } from './client';

import type {
  HealthAvailableMetric,
  HealthHomeAttention,
  HealthHomeReminder,
  HealthMeasurement,
  HealthMedication,
  HealthMember,
  HealthOverview,
  HealthProcessResponse,
  HealthRecord,
  HealthRecordDetail,
  HealthTimelineEvent,
  TrackedHealthMetric,
} from './web.types';

function qs(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

async function mutateHealth<T>(load: () => Promise<T>) {
  const result = await load();

  return result;
}

export const healthApi = {
  homeAttention: (signal?: AbortSignal) =>
    request<HealthHomeAttention>('/api/health/home-attention', {
      retryTransient: true,
      requiresAuth: true,
      dedupeMs: 5_000,
      signal,
    }),
  reminders: () =>
    request<HealthHomeReminder[]>('/api/health/reminders', {
      requiresAuth: true,
      dedupeMs: 5_000,
    }),
  createReminder: (payload: {
    memberId: string;
    title: string;
    type: 'appointment' | 'medicine' | 'refill' | 'other';
    dueDate: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  }) =>
    mutateHealth(() =>
      request('/api/health/reminders', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    ),
  members: (signal?: AbortSignal) =>
    request<HealthMember[]>('/api/health/members', {
      requiresAuth: true,
      dedupeMs: 5_000,
      signal,
    }),
  createMember: (payload: {
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
  }) =>
    mutateHealth(() =>
      request<HealthMember>('/api/health/members', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    ),
  updateMember: (
    memberId: string,
    payload: Partial<{
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
    }>,
  ) =>
    mutateHealth(() =>
      request<HealthMember>(
        `/api/health/members/${encodeURIComponent(memberId)}`,
        { method: 'PATCH', body: payload, requiresAuth: true },
      ),
    ),
  deleteMember: (memberId: string) =>
    mutateHealth(() =>
      request<void>(`/api/health/members/${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    ),
  overview: (memberId: string, signal?: AbortSignal) =>
    request<HealthOverview>(
      `/api/health/members/${encodeURIComponent(memberId)}/overview`,
      { requiresAuth: true, dedupeMs: 5_000, signal },
    ),
  records: (memberId: string, signal?: AbortSignal) =>
    request<HealthRecord[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/records`,
      { requiresAuth: true, dedupeMs: 5_000, signal },
    ),
  createRecord: (payload: {
    memberId?: string;
    documentId: string;
    type?: 'lab_report' | 'medical_report' | 'prescription';
  }) =>
    mutateHealth(() =>
      request<HealthProcessResponse>('/api/health/records', {
        method: 'POST',
        body: payload,
        requiresAuth: true,
      }),
    ),
  updateRecord: (
    recordId: string,
    payload: { type?: 'lab_report' | 'medical_report' | 'prescription' },
  ) =>
    mutateHealth(() =>
      request<HealthRecordDetail>(
        `/api/health/records/${encodeURIComponent(recordId)}`,
        { method: 'PATCH', body: payload, requiresAuth: true },
      ),
    ),
  record: (recordId: string) =>
    request<HealthRecordDetail>(
      `/api/health/records/${encodeURIComponent(recordId)}`,
      { requiresAuth: true, dedupeMs: 5_000 },
    ),
  deleteRecord: (recordId: string) =>
    mutateHealth(() =>
      request<void>(`/api/health/records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),
    ),
  measurements: (memberId: string, metric?: string, signal?: AbortSignal) =>
    request<HealthMeasurement[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/measurements${metric ? `?metric=${encodeURIComponent(metric)}` : ''}`,
      { requiresAuth: true, dedupeMs: 5_000, signal },
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
    mutateHealth(() =>
      request<HealthMeasurement>(
        `/api/health/members/${encodeURIComponent(memberId)}/measurements`,
        { method: 'POST', body: payload, requiresAuth: true },
      ),
    ),
  trackedMetrics: (memberId: string) =>
    request<TrackedHealthMetric[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics`,
      { requiresAuth: true, dedupeMs: 5_000 },
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
    mutateHealth(() =>
      request<TrackedHealthMetric>(
        `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics`,
        {
          method: 'POST',
          body: {
            metricKey: payload.metricKey,
            displayName: payload.displayName,
            context: payload.context ?? null,
            bodySite: payload.bodySite ?? null,
          },
          requiresAuth: true,
        },
      ),
    ),
  untrackMetric: (memberId: string, trackedId: string) =>
    mutateHealth(() =>
      request<void>(
        `/api/health/members/${encodeURIComponent(memberId)}/tracked-metrics/${encodeURIComponent(trackedId)}`,
        { method: 'DELETE', requiresAuth: true },
      ),
    ),
  availableMetrics: (memberId: string, search = '') =>
    request<HealthAvailableMetric[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/available-metrics?${qs({ search })}`,
      { requiresAuth: true, dedupeMs: 5_000 },
    ),
  timeline: (memberId: string, signal?: AbortSignal) =>
    request<HealthTimelineEvent[]>(
      `/api/health/members/${encodeURIComponent(memberId)}/timeline`,
      { requiresAuth: true, dedupeMs: 5_000, signal },
    ),
  createMedication: (
    memberId: string,
    payload: {
      name: string;
      dose: string;
      whenToTake: Array<'morning' | 'afternoon' | 'night'>;
      mealTiming: 'before_food' | 'after_food' | 'with_food' | 'any_time';
      repeatRunsOut?: string | null;
    },
  ) =>
    mutateHealth(() =>
      request<HealthMedication>(
        `/api/health/members/${encodeURIComponent(memberId)}/medications`,
        { method: 'POST', body: payload, requiresAuth: true },
      ),
    ),
  updateMedication: (
    medicationId: string,
    payload: Partial<{
      name: string;
      dose: string | null;
      whenToTake: Array<'morning' | 'afternoon' | 'night'>;
      mealTiming:
        'before_food' | 'after_food' | 'with_food' | 'any_time' | null;
      repeatRunsOut: string | null;
      frequency: string | null;
      duration: string | null;
      quantity: string | null;
      repeats: boolean;
      runsOutAt: string | null;
      status: 'continuing' | 'stopped';
      stoppedAt: string | null;
    }>,
  ) =>
    mutateHealth(() =>
      request<HealthMedication>(
        `/api/health/medications/${encodeURIComponent(medicationId)}`,
        { method: 'PATCH', body: payload, requiresAuth: true },
      ),
    ),
  deleteMedication: (medicationId: string) =>
    mutateHealth(() =>
      request<void>(
        `/api/health/medications/${encodeURIComponent(medicationId)}`,
        { method: 'DELETE', requiresAuth: true },
      ),
    ),
};
