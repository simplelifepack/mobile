import { EmptyState } from '../../components/feedback/EmptyState';
import { Platform } from 'react-native';
import { captureDocuments } from '../../native/captureDocuments';
import {
  pickDocuments,
  pickGallery,
  type PickedDocument,
} from '../../native/documentFiles';
import { BottomSheet } from '../shared/BottomSheet';
import { UploadDocumentSheet } from '../documents/UploadDocumentSheet';
import { HealthReportReview } from './HealthReportReview';
import { HealthMetricChooser } from './HealthMetricChooser';
import { HealthProfileResolution } from './HealthProfileResolution';
import { TextAction } from '../../components/primitives/TextAction';
import { Upload, Plus, Bell, Pill, Users } from 'lucide-react-native';
import { HealthIdentity, TrackedTestCard } from './HealthOverview';
import {
  buildHealthMetrics,
  metricIdentity,
  compareMeasurements,
} from './healthMetrics';
import { ReadingDialog } from './ReadingDialog';
import { ProfilePicker } from '../shared/ProfilePicker';
import { SectionTabs } from '../shared/SectionTabs';
import { Row } from '../../components/primitives/Row';
import React from 'react';
import { useRefreshOnFocus } from '../shared/useRefreshOnFocus';
import { HealthReadiness } from './HealthReadiness';
import { HealthPreparation } from './HealthPreparation';
import { MeasurementTrend } from './MeasurementTrend';
import { healthApi } from '../../api/health.api';
import { documentsApi } from '../../api/documents.api';
import type {
  HealthRecordDetail,
  HealthMemberResolution,
  HealthProcessResponse,
  HealthTimelineEvent,
  HealthMeasurement,
} from '../../api/web.types';
import { Card } from '../../components/primitives/Card';
import {
  FeaturePage,
  Stack,
  AppText,
  Button,
  Choice,
  Details,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
const memberFields = [
  { key: 'name', label: 'Name', required: true },
  {
    key: 'relation',
    label: 'Relationship',
    required: true,
    options: ['self', 'spouse', 'father', 'mother', 'child', 'other'],
  },
  { key: 'dateOfBirth', label: 'Date of birth', type: 'date' as const },
  {
    key: 'bloodGroup',
    label: 'Blood group',
    options: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
  },
  { key: 'conditions', label: 'Conditions' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'emergencyContactName', label: 'Emergency contact name' },
  {
    key: 'emergencyContactPhone',
    label: 'Emergency contact phone',
    type: 'phone' as const,
  },
  { key: 'primaryDoctor', label: 'Primary doctor' },
  { key: 'insuranceProvider', label: 'Insurance provider' },
  { key: 'insurancePolicyNumber', label: 'Policy number' },
];
export function HealthScreen({
  route,
}: {
  route?: { params?: { memberId?: string; recordId?: string; tab?: string } };
}) {
  const members = useResource(healthApi.members);
  const [selected, setSelected] = React.useState(route?.params?.memberId ?? '');
  const memberId = selected || members.data?.[0]?.id || '';
  const [tab, setTab] = React.useState(
    route?.params?.tab ?? (route?.params?.recordId ? 'Records' : 'Overview'),
  );
  const [uploadFiles, setUploadFiles] = React.useState<PickedDocument[]>();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<
    'lab_report' | 'medical_report' | 'prescription'
  >('lab_report');
  const pendingSource = React.useRef<(() => void) | null>(null);
  const finishSource = () => {
    const next = pendingSource.current;
    pendingSource.current = null;
    next?.();
  };
  const chooseSource = (next: () => void) => {
    pendingSource.current = next;
    setRecordSourceOpen(false);
    if (Platform.OS !== 'ios') finishSource();
  };
  const [recordSourceOpen, setRecordSourceOpen] = React.useState(false);
  const [resolution, setResolution] = React.useState<HealthMemberResolution>();
  const [chooserOpen, setChooserOpen] = React.useState(false);
  const [allTests, setAllTests] = React.useState(false);
  const [readingOpen, setReadingOpen] = React.useState(false);
  const [readingTest, setReadingTest] =
    React.useState<
      Pick<
        HealthMeasurement,
        | 'metricKey'
        | 'displayName'
        | 'unit'
        | 'context'
        | 'bodySite'
        | 'secondaryValue'
      >
    >();
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const [detail, setDetail] = React.useState<HealthRecordDetail>();
  const documents = useResource(documentsApi.list);
  const data = useResource(
    async signal => {
      if (!memberId) return null;
      const [overview, records, timeline, measurements] = await Promise.all([
        healthApi.overview(memberId, signal),
        healthApi.records(memberId, signal),
        healthApi.timeline(memberId, signal),
        healthApi.measurements(memberId, undefined, signal),
      ]);
      return {
        overview: {
          ...overview,
          trackedMetrics: overview.trackedMetrics.map(metric => ({
            ...metric,
            latest:
              [...metric.measurements].sort(compareMeasurements).at(-1) ?? null,
          })),
        },
        records,
        timeline,
        metrics: buildHealthMetrics(measurements, overview.trackedMetrics),
        measurements,
      };
    },
    [memberId],
  );
  useRefreshOnFocus(members.revalidate, documents.revalidate, data.revalidate);
  const action = useAction(() => {
    members.refresh();
    data.refresh();
  });
  React.useEffect(() => {
    if (route?.params?.recordId)
      void action.run(
        async () => setDetail(await healthApi.record(route.params!.recordId!)),
        '',
      );
  }, [route?.params?.recordId]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    setAllTests(false);
  }, [memberId]);
  const member = members.data?.find(item => item.id === memberId);
  React.useEffect(() => {
    if (route?.params?.memberId) setSelected(route.params.memberId);
    if (route?.params?.tab) setTab(route.params.tab);
  }, [route?.params?.memberId, route?.params?.tab]);

  const changeMember = (edit: boolean) =>
    setForm({
      title: edit ? 'Edit health profile' : 'Add health profile',
      draftId: edit ? `health-profile:${memberId}` : 'health-profile:new',
      fields: memberFields.map(field => ({
        ...field,
        options:
          field.key === 'relation' && edit && member
            ? member.relation === 'Myself'
              ? [{ label: 'Self', value: 'Myself' }]
              : field.options?.includes(member.relation)
                ? field.options
                : [
                    { label: member.relation, value: member.relation },
                    ...(field.options ?? []),
                  ]
            : field.options,
        initial:
          edit && member
            ? String(member[field.key as keyof typeof member] ?? '')
            : '',
      })),
      submit: async values => {
        if (edit)
          await healthApi.updateMember(memberId, {
            ...values,
            bloodGroup: values.bloodGroup || null,
            dateOfBirth: values.dateOfBirth || null,
          });
        else {
          const added = await healthApi.createMember({
            ...values,
            name: values.name,
            relation: values.relation,
            bloodGroup: values.bloodGroup || null,
            dateOfBirth: values.dateOfBirth || null,
          });
          setSelected(added.id);
        }
        members.refresh();
        data.refresh();
      },
    });
  const medication = (event?: HealthTimelineEvent) => {
    const existing = event?.medication;
    setForm({
      title: existing ? 'Edit medication' : 'Add medication',
      draftId: `health-medication:${memberId}:${event?.id ?? 'new'}`,
      fields: [
        {
          key: 'name',
          label: 'Medicine name',
          required: true,
          initial: existing?.name,
        },
        {
          key: 'dose',
          label: 'Dose',
          required: true,
          initial: existing?.dose ?? '',
        },
        {
          key: 'when',
          label: 'When to take',
          required: true,
          options: [
            { label: 'Morning', value: 'morning' },
            { label: 'Afternoon', value: 'afternoon' },
            { label: 'Night', value: 'night' },
            { label: 'Morning and afternoon', value: 'morning,afternoon' },
            { label: 'Morning and night', value: 'morning,night' },
            { label: 'Afternoon and night', value: 'afternoon,night' },
            {
              label: 'Morning, afternoon and night',
              value: 'morning,afternoon,night',
            },
          ],
          initial: existing?.whenToTake?.length
            ? ['morning', 'afternoon', 'night']
                .filter(time =>
                  existing.whenToTake?.includes(time as 'morning'),
                )
                .join(',')
            : 'morning',
        },
        {
          key: 'meal',
          label: 'Meal timing',
          options: ['before_food', 'after_food', 'with_food', 'any_time'],
          initial: existing?.mealTiming ?? 'any_time',
        },
        {
          key: 'repeatRunsOut',
          label: 'Repeat / runs out',
          type: 'date',
          initial: existing?.repeatRunsOut ?? '',
        },
      ],
      submit: async values => {
        const whenToTake = values.when
          .split(',')
          .map(item => item.trim()) as Array<'morning' | 'afternoon' | 'night'>;
        if (
          !whenToTake.length ||
          whenToTake.some(
            item => !['morning', 'afternoon', 'night'].includes(item),
          )
        )
          throw new Error(
            'Use morning, afternoon or night, separated by commas.',
          );
        const payload = {
          name: values.name,
          dose: values.dose,
          whenToTake,
          mealTiming: values.meal as 'any_time',
          repeatRunsOut: values.repeatRunsOut || null,
        };
        if (event) await healthApi.updateMedication(event.id, payload);
        else await healthApi.createMedication(memberId, payload);
        data.refresh();
      },
    });
  };
  const addReminder = () =>
    setForm({
      title: 'Add reminder',
      draftId: `health-reminder:${memberId}`,
      fields: [
        { key: 'title', label: 'Title', required: true },
        {
          key: 'type',
          label: 'Type',
          options: ['appointment', 'medicine', 'refill', 'other'],
          initial: 'appointment',
        },
        {
          key: 'dueDate',
          label: 'Due date',
          type: 'date',
          required: true,
        },
        {
          key: 'frequency',
          label: 'Frequency',
          options: ['once', 'daily', 'weekly', 'monthly'],
          initial: 'once',
        },
      ],
      submit: async values => {
        await healthApi.createReminder({
          memberId,
          title: values.title,
          type: values.type as 'appointment',
          dueDate: values.dueDate,
          frequency: values.frequency as 'once',
        });
        data.refresh();
      },
    });
  const processed = (result: HealthProcessResponse) => {
    if (result.processingStatus === 'awaiting_profile_match') {
      setResolution(result as HealthMemberResolution);
      return;
    }
    const record = result as HealthRecordDetail;
    setResolution(undefined);
    setSelected(record.memberId);
    setTab(record.type === 'prescription' ? 'Medications' : 'Records');
    setDetail(record);
    members.refresh();
    documents.refresh();
    data.refresh();
  };
  const addRecord = () =>
    setForm({
      title: 'Add health record',
      draftId: `health-record:${memberId}`,
      fields: [
        {
          key: 'documentId',
          label: 'Document',
          required: true,
          options: (documents.data ?? []).map(item => ({
            label: item.displayName || item.originalName,
            value: item.id,
          })),
        },
        {
          key: 'type',
          label: 'Record type',
          options: ['lab_report', 'medical_report', 'prescription'],
          initial: 'lab_report',
        },
      ],
      submit: async values => {
        const result = await healthApi.createRecord({
          memberId,
          documentId: values.documentId,
          type: values.type as 'lab_report',
        });
        processed(result);
      },
    });
  const [preparationRequest, setPreparationRequest] = React.useState<{
    id: number;
    view: string;
  }>();
  const prepare = (view: string) =>
    setPreparationRequest(previous => ({ id: (previous?.id ?? 0) + 1, view }));
  const openRecordSource = (source: 'camera' | 'files' | 'gallery') => {
    chooseSource(() => {
      void action.run(async () => {
        const files =
          source === 'camera'
            ? await captureDocuments()
            : source === 'gallery'
              ? await pickGallery()
              : await pickDocuments();
        if (!files.length) return;
        setUploadFiles(files);
        setUploadOpen(true);
      }, '');
    });
  };
  const logReading = () => {
    setReadingTest(undefined);
    setReadingOpen(true);
  };
  return (
    <FeaturePage
      title="Health"
      subtitle="Records, medicines and reminders"
      loading={
        (members.loading && !members.data) ||
        Boolean(memberId && data.loading && !data.data)
      }
      refreshing={members.loading || data.loading}
      actionTitle="Add to Health"
      actionSubtitle={member ? `For ${member.name.split(' ')[0]}` : undefined}
      actions={[
        {
          label: 'A record',
          description: 'Prescription, lab report, scan, or discharge summary',
          Icon: Upload,
          onPress: () => setRecordSourceOpen(true),
        },
        {
          label: 'A reading',
          description: 'Copy a value and its range from a report',
          Icon: Plus,
          disabled: !member,
          onPress: logReading,
        },
        {
          label: 'A reminder',
          description: 'Appointment, refill, or vaccination',
          Icon: Bell,
          disabled: !member,
          onPress: addReminder,
        },
        {
          label: 'A medicine',
          description: 'Name, dose, and how often',
          Icon: Pill,
          disabled: !member,
          onPress: () => medication(),
        },
        {
          label: 'A family member',
          description: 'Someone else whose records you keep',
          Icon: Users,
          onPress: () => changeMember(false),
        },
      ]}
    >
      <ResourceStatus resource={members} showLoading={false} />
      <ProfilePicker
        profiles={members.data ?? []}
        value={memberId}
        onChange={id => {
          setSelected(id);
          setDetail(undefined);
        }}
        onAdd={() => setTab('Profile')}
      />
      {members.data?.length === 0 ? (
        <EmptyState
          title="No health profiles yet"
          message="Create a profile to keep your health records together."
          actionLabel="Create my health profile"
          onAction={() => changeMember(false)}
        />
      ) : null}
      {member ? (
        <>
          <HealthIdentity
            member={member}
            onEdit={() => changeMember(true)}
            onPrepare={prepare}
          />
          <HealthPreparation
            hideTriggers
            openRequest={preparationRequest}
            onLogReading={logReading}
            member={member}
            records={data.data?.records ?? []}
            timeline={data.data?.timeline ?? []}
            documents={documents.data ?? []}
          />
          <SectionTabs
            label="Health views"
            variant="line"
            value={tab}
            options={[
              'Overview',
              { label: 'Trends', value: 'Measurements' },
              'Timeline',
              'Medications',
              'Records',
              'Profile',
            ]}
            onChange={setTab}
          />
          <ResourceStatus resource={data} showLoading={false} />
          {action.message ? <AppText>{action.message}</AppText> : null}
          {tab === 'Profile' ? (
            <>
              <Details
                value={Object.fromEntries(
                  memberFields
                    .map(field => [
                      field.label,
                      member[field.key as keyof typeof member],
                    ])
                    .filter(([, value]) => value != null && value !== ''),
                )}
              />
              <Button title="Edit profile" onPress={() => changeMember(true)} />
              {member.relation !== 'Myself' ? (
                <Button
                  title="Delete profile"
                  variant="danger"
                  disabled={action.busy}
                  onPress={() =>
                    confirmAction('Delete health profile?', () => {
                      void action.run(async () => {
                        await healthApi.deleteMember(memberId);
                        setSelected('');
                      });
                    })
                  }
                />
              ) : null}
            </>
          ) : null}
          {tab === 'Overview' ? (
            <>
              <Stack gap="xs">
                <AppText variant="caption" color="muted">
                  Showing{' '}
                  {Math.min(
                    allTests ? Infinity : 4,
                    data.data?.overview.trackedMetrics.length ?? 0,
                  )}{' '}
                  of {data.data?.overview.trackedMetrics.length ?? 0} tracked
                  tests
                </AppText>
                <Row align="center" justify="flex-end">
                  {(data.data?.overview.trackedMetrics.length ?? 0) > 4 ? (
                    <TextAction
                      title={allTests ? 'Show less' : 'Show all'}
                      onPress={() => setAllTests(value => !value)}
                    />
                  ) : null}
                </Row>
              </Stack>
              {(data.data?.overview.trackedMetrics ?? [])
                .slice(0, allTests ? undefined : 4)
                .map(metric => (
                  <TrackedTestCard
                    key={metric.id}
                    name={metric.displayName}
                    onLog={() => {
                      setReadingTest({
                        metricKey: metric.metricKey,
                        displayName: metric.displayName,
                        unit:
                          metric.latest?.unit ||
                          metric.measurements[0]?.unit ||
                          '',
                        context: metric.context,
                        bodySite: metric.bodySite,
                        secondaryValue: metric.latest?.secondaryValue,
                      });
                      setReadingOpen(true);
                    }}
                    measurements={metric.measurements}
                    latest={metric.latest}
                    busy={action.busy}
                    onRemove={() => {
                      void action.run(() =>
                        healthApi.untrackMetric(memberId, metric.id),
                      );
                    }}
                  />
                ))}
              {data.data?.overview.trackedMetrics.length === 0 ? (
                <EmptyState
                  title="No tests tracked yet"
                  message="Choose the tests you want to follow."
                  actionLabel="Go to Trends"
                  onAction={() => setTab('Measurements')}
                />
              ) : null}
              {data.data ? (
                <HealthReadiness
                  key={member.id}
                  member={member}
                  records={data.data.records}
                  onEdit={() => changeMember(true)}
                  onRecords={() => setTab('Records')}
                />
              ) : null}
              <AppText variant="heading">Reminders</AppText>
              {data.data?.overview.upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming reminders"
                  message="Add an appointment or medicine reminder."
                  actionLabel="Add a reminder"
                  onAction={addReminder}
                />
              ) : null}
              {data.data?.overview.upcoming.map(item => (
                <Card key={item.id}>
                  <AppText>
                    {item.title} · {item.dueDate?.slice(0, 10) ?? 'No date'}
                  </AppText>
                </Card>
              ))}
            </>
          ) : null}
          {tab === 'Records' ? (
            <>
              {data.data?.records.length === 0 ? (
                <EmptyState
                  title="No health records yet"
                  message="Add a report or prescription to this profile."
                  actionLabel="Add a health record"
                  onAction={() => setRecordSourceOpen(true)}
                />
              ) : null}
              {data.data?.records.map(record => (
                <Card key={record.id}>
                  <Stack>
                    <AppText variant="rowTitle">
                      {record.type.replace(/_/g, ' ')}
                    </AppText>
                    <AppText>
                      {record.documentDate?.slice(0, 10)} ·{' '}
                      {record.processingStatus}
                    </AppText>
                    {record.processingError ? (
                      <AppText color="danger">{record.processingError}</AppText>
                    ) : null}
                    <Button
                      title="View record"
                      disabled={action.busy}
                      onPress={() => {
                        void action.run(
                          async () =>
                            setDetail(await healthApi.record(record.id)),
                          '',
                        );
                      }}
                    />
                    <Button
                      title="Change record type"
                      variant="secondary"
                      onPress={() =>
                        setForm({
                          title: 'Record type',
                          fields: [
                            {
                              key: 'type',
                              label: 'Type',
                              options: [
                                'lab_report',
                                'medical_report',
                                'prescription',
                              ],
                              initial: record.type,
                            },
                          ],
                          submit: async values => {
                            await healthApi.updateRecord(record.id, {
                              type: values.type as 'lab_report',
                            });
                            data.refresh();
                            setDetail(undefined);
                          },
                        })
                      }
                    />
                    <Button
                      title="Delete record"
                      variant="danger"
                      onPress={() =>
                        confirmAction('Delete record?', () => {
                          void action.run(() =>
                            healthApi.deleteRecord(record.id),
                          );
                          setDetail(undefined);
                        })
                      }
                    />
                  </Stack>
                </Card>
              ))}
            </>
          ) : null}
          {tab === 'Measurements' ? (
            <>
              <Button
                title="Choose tracked tests"
                variant="secondary"
                onPress={() => setChooserOpen(true)}
              />
              <Button title="Add measurement" onPress={logReading} />
              {data.data?.metrics.map(metric => (
                <Card
                  key={`${metric.metricKey}:${metric.context}:${metric.bodySite}`}
                >
                  <Stack>
                    <AppText variant="rowTitle">{metric.displayName}</AppText>
                    <AppText>
                      {metric.latestValue} {metric.unit} ·{' '}
                      {metric.historicalReadingCount}{' '}
                      {metric.historicalReadingCount === 1
                        ? 'reading'
                        : 'readings'}
                    </AppText>
                    <MeasurementTrend
                      measurements={(data.data?.measurements ?? []).filter(
                        reading =>
                          metricIdentity(reading) === metricIdentity(metric),
                      )}
                    />
                    {(data.data?.measurements ?? [])
                      .filter(
                        reading =>
                          metricIdentity(reading) === metricIdentity(metric),
                      )
                      .slice()
                      .sort((a, b) => compareMeasurements(b, a))
                      .map(reading => (
                        <AppText key={reading.id}>
                          {reading.measuredAt?.slice(0, 10) || 'Undated'} ·{' '}
                          {reading.value}
                          {reading.secondaryValue != null
                            ? ` / ${reading.secondaryValue}`
                            : ''}{' '}
                          {reading.unit} ·{' '}
                          {reading.sourceType.replace(/_/g, ' ')}
                        </AppText>
                      ))}
                    {!metric.isTracked ? (
                      <Button
                        title="Track metric"
                        disabled={action.busy}
                        onPress={() => {
                          void action.run(() =>
                            healthApi.trackMetric(memberId, metric),
                          );
                        }}
                      />
                    ) : (
                      <Button
                        title="Stop tracking"
                        variant="ghost"
                        disabled={action.busy}
                        onPress={() => {
                          const tracked =
                            data.data?.overview.trackedMetrics.find(
                              item =>
                                metricIdentity(item) === metricIdentity(metric),
                            );
                          if (tracked)
                            void action.run(() =>
                              healthApi.untrackMetric(memberId, tracked.id),
                            );
                        }}
                      />
                    )}
                  </Stack>
                </Card>
              ))}
            </>
          ) : null}
          {tab === 'Medications' ? (
            <>
              {data.data?.timeline.every(
                event => event.eventType !== 'medication',
              ) ? (
                <EmptyState
                  title="No medications recorded"
                  message="Add a medicine to keep its details here."
                  actionLabel="Add a medication"
                  onAction={() => medication()}
                />
              ) : null}
              {data.data?.timeline
                .filter(event => event.eventType === 'medication')
                .map(event => (
                  <Card key={event.id}>
                    <Stack>
                      <AppText variant="rowTitle">{event.title}</AppText>
                      <AppText>
                        {event.medication?.dose || 'Dose not recorded'}
                      </AppText>
                      <AppText color="muted">
                        {event.medication?.whenToTake?.join(' · ') ||
                          event.medication?.frequency ||
                          'Timing not recorded'}{' '}
                        ·{' '}
                        {event.medication?.mealTiming?.replace(/_/g, ' ') ||
                          'Any time'}
                      </AppText>
                      <AppText variant="caption" color="muted">
                        {event.medication?.status === 'stopped'
                          ? 'Stopped'
                          : 'Continuing'}
                        {event.medication?.repeatRunsOut
                          ? ` · Runs out ${event.medication.repeatRunsOut.slice(0, 10)}`
                          : ''}
                      </AppText>
                      <Button
                        title="Edit medication"
                        onPress={() => medication(event)}
                      />
                      <Button
                        title={
                          event.medication?.status === 'stopped'
                            ? 'Resume medication'
                            : 'Stop medication'
                        }
                        disabled={action.busy}
                        variant="secondary"
                        onPress={() => {
                          void action.run(() =>
                            healthApi.updateMedication(event.id, {
                              status:
                                event.medication?.status === 'stopped'
                                  ? 'continuing'
                                  : 'stopped',
                              stoppedAt:
                                event.medication?.status === 'stopped'
                                  ? null
                                  : new Date().toISOString(),
                            }),
                          );
                        }}
                      />
                      <Button
                        title="Delete medication"
                        variant="danger"
                        disabled={action.busy}
                        onPress={() =>
                          confirmAction('Delete medication?', () => {
                            void action.run(() =>
                              healthApi.deleteMedication(event.id),
                            );
                          })
                        }
                      />
                    </Stack>
                  </Card>
                ))}
            </>
          ) : null}
          {tab === 'Timeline' && data.data?.timeline.length === 0 ? (
            <EmptyState
              title="No health history yet"
              message="Add a reading or report to start your timeline."
              actionLabel="Log a reading"
              onAction={logReading}
            />
          ) : null}
          {tab === 'Timeline'
            ? data.data?.timeline.map(event => (
                <Card key={event.id}>
                  <Stack>
                    <AppText variant="rowTitle">{event.title}</AppText>
                    <AppText>
                      {event.occurredAt?.slice(0, 10)} · {event.detail ?? ''}{' '}
                      {event.value ?? ''} {event.unit ?? ''}
                    </AppText>
                  </Stack>
                </Card>
              ))
            : null}
        </>
      ) : null}
      <BottomSheet
        visible={recordSourceOpen}
        title="Add health record"
        onClose={() => setRecordSourceOpen(false)}
        onDismiss={finishSource}
      >
        <Choice
          label="Record type"
          value={uploadType}
          options={['lab_report', 'medical_report', 'prescription']}
          onChange={value => setUploadType(value as typeof uploadType)}
        />
        <Button
          title="Capture health record"
          onPress={() => openRecordSource('camera')}
        />
        <Button
          title="Upload a new report"
          onPress={() => openRecordSource('files')}
        />
        <Button
          title="From gallery"
          variant="secondary"
          onPress={() => openRecordSource('gallery')}
        />
        <Button
          title="Choose from Documents"
          disabled={!documents.data?.length || !member}
          onPress={() => {
            chooseSource(addRecord);
          }}
        />
      </BottomSheet>
      {uploadOpen ? (
        <UploadDocumentSheet
          initialFiles={uploadFiles}
          category="Medical"
          documentType="Medical Report"
          onClose={() => setUploadOpen(false)}
          onSaved={async document => {
            const result = await healthApi.createRecord({
              memberId: memberId || undefined,
              documentId: document.id,
              type: uploadType,
            });
            setUploadOpen(false);
            processed(result);
          }}
        />
      ) : null}
      {resolution ? (
        <HealthProfileResolution
          resolution={resolution}
          members={members.data ?? []}
          onClose={() => setResolution(undefined)}
          onProcessed={processed}
          onMembersChanged={members.refresh}
        />
      ) : null}
      {detail ? (
        <HealthReportReview
          key={detail.id}
          record={detail}
          onClose={() => setDetail(undefined)}
          onChanged={data.refresh}
        />
      ) : null}
      {chooserOpen && member ? (
        <HealthMetricChooser
          memberId={memberId}
          onClose={() => setChooserOpen(false)}
          onChanged={data.refresh}
        />
      ) : null}
      {readingOpen && member ? (
        <ReadingDialog
          memberId={memberId}
          memberName={member.name}
          measurements={data.data?.measurements ?? []}
          initialTest={readingTest}
          trackedTests={(data.data?.overview.trackedMetrics ?? []).map(
            metric => ({
              metricKey: metric.metricKey,
              displayName: metric.displayName,
              unit: metric.latest?.unit || metric.measurements[0]?.unit || '',
              context: metric.context,
              bodySite: metric.bodySite,
              secondaryValue: metric.latest?.secondaryValue,
            }),
          )}
          onClose={() => setReadingOpen(false)}
          onSaved={data.refresh}
        />
      ) : null}
      <ActiveForm form={form} onClose={() => setForm(null)} />
    </FeaturePage>
  );
}
