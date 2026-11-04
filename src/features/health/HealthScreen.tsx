import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation,type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React,{ useEffect,useMemo,useState } from 'react';
import {
Alert,
Modal,
Pressable,
View
} from 'react-native';

import {
Activity,
CalendarClock,
Check,
FlaskConical,
Pill,
Plus,
Upload,
Image as ImageIcon,
Camera,
FileText,
} from 'lucide-react-native';


import {
healthApi,
type HealthHomeReminder,
type HealthMedication,
type HealthMember,
type HealthMemberResolution,
type HealthOverview,
type HealthRecordDetail,
type HealthTimelineEvent
} from '../../api/health.api';
import type { MainTabParamList,RootStackParamList } from '../../app/navigation/types';
import { useBootstrapQuery, useDocumentsQuery } from '../../services/api';
import {
captureDocumentPhoto,
discardSelectedDocument,
selectDocumentFile,
selectImageFromGallery,
startConsentedImport,
type SelectedDocument,
} from '../documents/documentImport';
import {
healthDocumentTypeLabels,
importHealthRecord,
resolutionMessage,
type HealthDocumentType,
} from './healthRecordImport';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import { LoadingState } from '../../components/feedback/LoadingState';
import { ProcessingOverlay } from '../../components/feedback/ProcessingOverlay';
import { AppText } from '../../components/primitives/AppText';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AddToHealthSheet,MetricPickerModal } from './components/AddToHealthSheet';
import { HealthMemberForm,HealthReadingForm,HealthReminderForm,MedicationForm } from './components/HealthForms';
import { HealthTabs,PrepareVisit,QuickActions } from './components/HealthNavigation';
import { EmergencyInfoSheet } from './components/EmergencyInfoSheet';
import { VisitPackSheet } from './components/VisitPackSheet';
import { MedicalReadiness,Reminders } from './components/HealthPanels';
import { Header,MemberProfile,MemberSelector } from './components/MemberComponents';
import { ReadingCard } from './components/ReadingViews';
import { ListGroup, ListRow } from '../../components/primitives/ListRow';
import { StatusBadge } from '../../components/feedback/StatusBadge';
import { sizes } from '../../design/tokens/sizes';
import { styles } from './healthStyles';
import { ReadingView } from './healthTypes';
import { formatDate } from '../../utils/format';

export function HealthScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Health'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const bootstrap =
    useBootstrapQuery();
  const [members, setMembers] = useState<HealthMember[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [overview, setOverview] = useState<HealthOverview>();
  const { data: documents } = useDocumentsQuery();
  const [timeline, setTimeline] = useState<HealthTimelineEvent[]>([]);
  const [reminders, setReminders] = useState<HealthHomeReminder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [healthError, setHealthError] = useState<string>();
  const [recordSourceVisible, setRecordSourceVisible] = useState(false);
  const [memberFormVisible, setMemberFormVisible] = useState(false);
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [visitPackVisible, setVisitPackVisible] = useState(false);
  const [reminderFormVisible, setReminderFormVisible] = useState(false);
  const [metricPickerVisible, setMetricPickerVisible] = useState(false);
  const [medicationFormVisible, setMedicationFormVisible] = useState(false);
  const [addHealthVisible, setAddHealthVisible] = useState(false);
  const [readingFormVisible, setReadingFormVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resolution, setResolution] = useState<HealthMemberResolution>();

  const [
    activeTab,
    setActiveTab,
  ] = useState('Overview');

  const refreshMemberData = async (memberId: string) => {
    const [nextOverview, nextTimeline] = await Promise.all([
      healthApi.overview(memberId),
      healthApi.timeline(memberId),
    ]);
    setOverview(nextOverview);
    setTimeline(nextTimeline);
  };

  const refreshAll = async () => {
    try {
      const [loadedMembers, loadedReminders] = await Promise.all([
        healthApi.members(),
        healthApi.reminders(),
      ]);
      setMembers(loadedMembers);
      setReminders(loadedReminders);
      const memberId = selectedMember || loadedMembers[0]?.id;
      if (memberId) await refreshMemberData(memberId);
      setHealthError(undefined);
    } catch (loadError) {
      setHealthError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to refresh health records.',
      );
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([healthApi.members(), healthApi.reminders()])
      .then(([loadedMembers, loadedReminders]) => {
        if (!active) return;
        setMembers(loadedMembers);
        setReminders(loadedReminders);
        setSelectedMember(current => current || loadedMembers[0]?.id || '');
      })
      .catch(loadError => {
        if (active) {
          setHealthError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load health profiles.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMember) return;
    let active = true;
    setLoadingOverview(true);
    Promise.all([
      healthApi.overview(selectedMember),
      healthApi.timeline(selectedMember),
    ])
      .then(([loadedOverview, loadedTimeline]) => {
        if (!active) return;
        setOverview(loadedOverview);
        setTimeline(loadedTimeline);
      })
      .catch(loadError => {
        if (active) {
          setHealthError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this health profile.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOverview(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMember]);

  const readiness =
    useMemo(() => {
      const documents =
        bootstrap.data
          ?.documents ?? [];

      if (!documents.length) {
        return 0;
      }

      const verified =
        documents.filter(
          document =>
            document.classificationStatus ===
              'verified' &&
            document.ownershipStatus ===
              'verified',
        ).length;

      return Math.round(
        (verified /
          documents.length) *
          100,
      );
    }, [
      bootstrap.data?.documents,
    ]);

  const member =
    members.find(
      item => item.id === selectedMember,
    );

  const readings: ReadingView[] = (overview?.trackedMetrics ?? [])
    .filter(metric => metric.latest)
    .map(metric => {
      const latest = metric.latest!;
      const points = metric.measurements.slice(-4);
      const outsideRange =
        (latest.referenceMin != null && latest.value < latest.referenceMin) ||
        (latest.referenceMax != null && latest.value > latest.referenceMax);
      return {
        id: metric.id,
        title: metric.displayName,
        value:
          latest.secondaryValue == null
            ? String(latest.value)
            : `${latest.value}/${latest.secondaryValue}`,
        unit: latest.unit,
        status: outsideRange
          ? 'outside printed range'
          : latest.referenceText || latest.referenceMin != null || latest.referenceMax != null
            ? 'within reference range'
            : 'no range on file',
        range:
          latest.referenceText ??
          (latest.referenceMax != null
            ? `under ${latest.referenceMax}`
            : latest.referenceMin != null
              ? `over ${latest.referenceMin}`
              : undefined),
        dates: points.map(point =>
          point.measuredAt
            ? new Date(point.measuredAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            : '',
        ),
        values: points.map(point => point.value),
        color: outsideRange ? 'danger' : 'primary',
        sourceName: latest.originalName,
      };
    });

  const toggleMedication = async (medication: HealthMedication) => {
    try {
      await healthApi.updateMedication(medication.id, {
        status: medication.status === 'stopped' ? 'continuing' : 'stopped',
        stoppedAt: medication.status === 'stopped' ? null : new Date().toISOString(),
      });
      await refreshMemberData(selectedMember);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Unable to update medication.');
    }
  };

  const showImportedRecord = async (record: HealthRecordDetail) => {
    setSelectedMember(record.memberId);
    await refreshMemberData(record.memberId);
    setActiveTab(record.type === 'prescription' ? 'Medications' : 'Records');
    Alert.alert(
      'Health record added',
      record.measurements.length
        ? `${record.measurements.length} measurement(s) were extracted.`
        : record.processingStatus === 'failed'
          ? "We couldn't process this health record. Try again."
          : 'Health record processed.',
    );
  };

  const runRecordImport = async (
    selected: SelectedDocument,
    aiConsent: boolean,
    type: HealthDocumentType | undefined,
    memberId: string | undefined,
  ) => {
    setImporting(true);
    setHealthError(undefined);
    try {
      const result = await importHealthRecord(selected, {
        memberId,
        type,
        aiConsent,
      });
      if (result.kind === 'resolution') {
        setResolution(result.resolution);
        Alert.alert('Choose a profile', resolutionMessage(result.resolution));
      } else {
        await showImportedRecord(result.record);
      }
    } catch (importError) {
      setHealthError(
        importError instanceof Error
          ? importError.message
          : 'Health record could not be processed.',
      );
    } finally {
      setImporting(false);
    }
  };

  const chooseRecordType = (
    selected: SelectedDocument,
    aiConsent: boolean,
  ) => {
    if (aiConsent) {
      runRecordImport(selected, true, undefined, selectedMember || undefined);
      return;
    }
    Alert.alert(
      'Record type',
      'What kind of record is this?',
      [
        ...(Object.keys(healthDocumentTypeLabels) as HealthDocumentType[]).map(
          type => ({
            text: healthDocumentTypeLabels[type],
            onPress: () =>
              runRecordImport(selected, false, type, selectedMember || undefined),
          }),
        ),
      ],
      {
        cancelable: true,
        onDismiss: () => discardSelectedDocument(selected),
      },
    );
  };

  const startRecordImport = (
    select: () => Promise<SelectedDocument | undefined>,
  ) =>
    startConsentedImport({
      select,
      onConsent: chooseRecordType,
      selectionErrorTitle: 'Unable to select file',
    });

  const importRecord = (select: Parameters<typeof startRecordImport>[0]) => {
    setRecordSourceVisible(false);
    startRecordImport(select);
  };

  const confirmResolution = async (memberId: string) => {
    if (!resolution) return;
    setImporting(true);
    try {
      const record = await healthApi.createRecord({
        memberId,
        documentId: resolution.documentId,
        type: resolution.type,
      });
      if ('processingStatus' in record && record.processingStatus === 'awaiting_profile_match') {
        throw new Error('A health profile still needs to be selected.');
      }
      setResolution(undefined);
      await showImportedRecord(record as HealthRecordDetail);
    } catch (resolveError) {
      setHealthError(
        resolveError instanceof Error
          ? resolveError.message
          : 'Unable to assign this health record.',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={refreshAll}
floatingAction={
  <>
    <FloatingActionButton
      accessibilityLabel="Add to Health"
      onPress={() => setAddHealthVisible(true)}
    />
    <ActionSheet
      visible={recordSourceVisible}
      title="Add health record"
      onClose={() => setRecordSourceVisible(false)}
      options={[
        { label: 'Camera', icon: Camera, onPress: () => importRecord(captureDocumentPhoto) },
        { label: 'Photo library', icon: ImageIcon, onPress: () => importRecord(selectImageFromGallery) },
        { label: 'Choose file', icon: FileText, onPress: () => importRecord(selectDocumentFile) },
      ]}
    />
    {addHealthVisible ? (
      <AddToHealthSheet
        memberName={member?.name ?? 'your profile'}
        onClose={() => setAddHealthVisible(false)}
        onRecord={() => {
          setAddHealthVisible(false);
          setRecordSourceVisible(true);
        }}
        onReading={() => {
          setAddHealthVisible(false);
          setReadingFormVisible(true);
        }}
        onReminder={() => {
          setAddHealthVisible(false);
          setReminderFormVisible(true);
        }}
        onMedicine={() => {
          setAddHealthVisible(false);
          setMedicationFormVisible(true);
        }}
        onFamilyMember={() => {
          setAddHealthVisible(false);
          setMemberFormVisible(true);
        }}
      />
    ) : null}
  </>
}    >
      <Stack
        gap="sm"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.lg,
          },
        ]}
      >
        <Stack gap="sm">
        {/* HEADER */}

        <Header
          onSearch={() => setMetricPickerVisible(true)}
        />
        {healthError ? (
          <AppText variant="caption" color="danger">
            {healthError}
          </AppText>
        ) : null}
        <ProcessingOverlay visible={importing} label="Processing health record…" />
        {loadingMembers || loadingOverview ? (
          <LoadingState label="Loading health records…" />
        ) : null}

        {/* FAMILY MEMBERS */}

        <MemberSelector
          members={members}
          selected={
            selectedMember
          }
          onSelect={
            setSelectedMember
          }
        />

        </Stack>

        <Stack gap="sm">
        {/* MEMBER PROFILE */}

        {member ? (
          <MemberProfile member={member} />
        ) : (
          <Card>
            <Stack gap="sm">
              <AppText variant="heading">No health profiles yet</AppText>
              <AppText color="secondary">
                Add a family health profile to start organizing care.
              </AppText>
              <Pressable onPress={() => setMemberFormVisible(true)}>
                <AppText variant="label" color="primary">Add health profile</AppText>
              </Pressable>
            </Stack>
          </Card>
        )}

        {/* PREPARE */}

        <PrepareVisit onPress={() => setVisitPackVisible(true)} />

        {/* QUICK ACTIONS */}

        <QuickActions
  onInsurance={() => navigation.navigate('Documents')}
  onEmergency={() => setEmergencyVisible(true)}
/>

        </Stack>

        <Stack gap="md">
        {/* TABS */}

        <HealthTabs
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
        />

        {activeTab ===
        'Overview' ? (
          <Stack gap="md">
            {/* RESULTS HEADER */}

           <Row
  align="center"
  gap="sm"
  style={styles.resultsHeader}
>
  <AppText
    variant="body"
    color="secondary"
    style={styles.resultsCount}
    numberOfLines={1}
  >
    Showing {readings.length} of{' '}
    {overview?.trackedMetrics?.length ?? readings.length}{' '}
    tracked tests
  </AppText>

  <Pressable
    onPress={() => setMetricPickerVisible(true)}
  >
    <AppText
      variant="label"
      color="primary"
      numberOfLines={1}
    >
      Choose tests
    </AppText>
  </Pressable>

  <Pressable>
    <AppText
      variant="label"
      color="primary"
      numberOfLines={1}
    >
      Show all
    </AppText>
  </Pressable>
</Row>
            {/* READINGS */}

            <Stack gap="sm">
              {readings.length ? readings.map(
                reading => (
                  <ReadingCard
                    key={
                      reading.id
                    }
                    reading={
                      reading
                    }
                  />
                ),
              ) : (
                <Card>
                  <AppText variant="body" color="secondary">
                    No tracked measurements yet.
                  </AppText>
                </Card>
              )}
            </Stack>

            {/* REMINDERS */}

            <Reminders
              reminders={reminders}
              onAdd={() => setReminderFormVisible(true)}
            />

            {/* MEDICAL READINESS */}

            <MedicalReadiness
              readiness={
                readiness
              }
              member={member}
            />
          </Stack>
        ) : activeTab === 'Timeline' ? (
          <Stack gap="sm" style={styles.healthTabContent}>
            {/* COMING UP */}
            <View
              style={[
                styles.healthTabCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <AppText
                variant="label"
                color="secondary"
                style={styles.healthSectionEyebrow}
              >
                COMING UP
              </AppText>

              {reminders.length ? (
                reminders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate ?? 0).getTime() -
                      new Date(b.dueDate ?? 0).getTime(),
                  )
                  .slice(0, 3)
                  .map(reminder => (
                    <View
                      key={reminder.id}
                      style={[
                        styles.healthReminderRow,
                        { borderTopColor: theme.colors.border.default },
                      ]}
                    >
                      <View style={styles.healthReminderCopy}>
                        <AppText variant="label">
                          {reminder.title}
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          {reminder.dueDate
                            ? formatDate(reminder.dueDate)
                            : 'Date not set'}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.healthSmallAction,
                          { borderColor: theme.colors.border.default },
                        ]}
                      >
                        <CalendarClock
                          size={sizes.icon.md}
                          color={theme.colors.text.secondary}
                        />
                      </View>
                    </View>
                  ))
              ) : (
                <AppText color="secondary" style={styles.healthEmptyText}>
                  No upcoming reminders.
                </AppText>
              )}
            </View>

            {/* TIMELINE EVENTS */}
            <View
              style={[
                styles.healthTabCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              {timeline.length ? (
                timeline.map((event, index) => {
                  const date = event.occurredAt
                    ? new Date(event.occurredAt)
                    : undefined;
                  const monthLabel = date
                    ? date
                        .toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })
                        .toUpperCase()
                    : 'DATE NOT RECORDED';
                  const previousDate =
                    index > 0 && timeline[index - 1].occurredAt
                      ? new Date(timeline[index - 1].occurredAt as string)
                      : undefined;
                  const previousMonth = previousDate
                    ? previousDate
                        .toLocaleDateString(undefined, {
                          month: 'short',
                          year: 'numeric',
                        })
                        .toUpperCase()
                    : undefined;
                  const showMonth = index === 0 || monthLabel !== previousMonth;

                  return (
                    <React.Fragment key={event.id}>
                      {showMonth ? (
                        <AppText
                          variant="label"
                          color="primary"
                          style={styles.healthMonthLabel}
                        >
                          {monthLabel}
                        </AppText>
                      ) : null}

                      <View style={styles.healthTimelineRow}>
                        <View style={styles.healthTimelineRail}>
                          <View
                            style={[
                              styles.healthTimelineDot,
                              {
                                backgroundColor: event.medication
                                  ? theme.colors.icon.interactive
                                  : theme.colors.status.info.icon,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.healthTimelineLine,
                              { backgroundColor: theme.colors.border.default },
                            ]}
                          />
                        </View>

                        <View
                          style={[
                            styles.healthTimelineIcon,
                            {
                              backgroundColor: theme.colors.surface.raised,
                            },
                          ]}
                        >
                          {event.medication ? (
                            <Pill size={sizes.icon.md} color={theme.colors.text.interactive} />
                          ) : event.title.toLowerCase().includes('report') ? (
                            <FlaskConical
                              size={sizes.icon.md}
                              color={theme.colors.text.interactive}
                            />
                          ) : (
                            <Activity
                              size={sizes.icon.md}
                              color={theme.colors.status.info.icon}
                            />
                          )}
                        </View>

                        <View style={styles.healthTimelineCopy}>
                          <AppText variant="label">
                            {event.title}
                            {event.detail ? ` ${event.detail}` : ''}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {event.medication
                              ? 'Medication · Activity recorded'
                              : 'Reading · Reading logged'}
                          </AppText>
                        </View>

                        <AppText
                          variant="caption"
                          color="secondary"
                          style={styles.healthTimelineDate}
                        >
                          {date
                            ? date.toLocaleDateString(undefined, {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })
                            : '—'}
                        </AppText>
                      </View>
                    </React.Fragment>
                  );
                })
              ) : (
                <AppText color="secondary" style={styles.healthEmptyText}>
                  No timeline activity yet.
                </AppText>
              )}
            </View>
          </Stack>
        ) : activeTab === 'Medications' ? (
          <Stack gap="sm" style={styles.healthTabContent}>
            <View
              style={[
                styles.healthTabCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <View style={styles.healthSectionHeader}>
                <View style={styles.healthSectionTitleRow}>
                  <Pill size={sizes.icon.md} color={theme.colors.text.secondary} />
                  <AppText variant="label">Current medications</AppText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMedicationFormVisible(true)}
                  style={[
                    styles.healthAddButton,
                    {
                      borderColor: theme.colors.border.default,
                      backgroundColor: theme.colors.surface.raised,
                    },
                  ]}
                >
                  <Plus size={sizes.icon.md} color={theme.colors.text.interactive} />
                  <AppText variant="label" color="primary">
                    Add
                  </AppText>
                </Pressable>
              </View>

              {timeline.filter(event => event.medication).length ? (
                <ListGroup>
                  {timeline
                    .filter(event => event.medication)
                    .map(event => {
                      const medication = event.medication!;
                      const stopped = medication.status === 'stopped';

                      return (
                        <ListRow
                          key={event.id}
                          icon={<Pill size={sizes.icon.md} color={theme.colors.icon.interactive} />}
                          title={`${medication.name}${medication.dose ? ` ${medication.dose}` : ''}`}
                          subtitle={medication.frequency || 'Schedule not set'}
                          trailing={
                            <StatusBadge
                              label={stopped ? 'Stopped' : 'Not confirmed'}
                              status={stopped ? 'info' : 'warning'}
                            />
                          }
                        >
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              void toggleMedication(medication);
                            }}
                            style={[
                              styles.healthMedicationStatusButton,
                              { borderColor: theme.colors.border.default },
                            ]}
                          >
                            <Check size={sizes.icon.sm} color={theme.colors.text.primary} />
                            <AppText variant="caption">
                              {stopped ? 'Resume' : 'Still taking'}
                            </AppText>
                          </Pressable>
                        </ListRow>
                      );
                    })}
                </ListGroup>
              ) : (
                <AppText color="secondary" style={styles.healthEmptyText}>
                  No medication records yet.
                </AppText>
              )}
            </View>
          </Stack>
        ) : (
          <Stack gap="sm" style={styles.healthTabContent}>
            <View
              style={[
                styles.healthTabCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => setRecordSourceVisible(true)}
                style={[
                  styles.healthUploadButton,
                  {
                    backgroundColor: theme.colors.surface.raised,
                    borderColor: theme.colors.border.default,
                  },
                ]}
              >
                <Upload size={sizes.icon.md} color={theme.colors.text.interactive} />
                <AppText variant="label">Upload medical record</AppText>
              </Pressable>

              {overview?.recentRecords.length ? (
                overview.recentRecords.map(record => {
                  return (
                    <View
                      key={record.id}
                      style={[
                        styles.healthRecordRow,
                        { borderTopColor: theme.colors.border.default },
                      ]}
                    >
                      <View style={styles.healthTimelineRail}>
                        <View
                          style={[
                            styles.healthTimelineDot,
                            { backgroundColor: theme.colors.icon.interactive },
                          ]}
                        />
                      </View>

                      <View
                        style={[
                          styles.healthRecordIcon,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        {record.type.toLowerCase().includes('prescription') ? (
                          <Pill size={sizes.icon.md} color={theme.colors.text.interactive} />
                        ) : (
                          <FlaskConical
                            size={sizes.icon.md}
                            color={theme.colors.text.interactive}
                          />
                        )}
                      </View>

                      <View style={styles.healthRecordCopy}>
                        <AppText variant="label">
                          {record.type.replaceAll('_', ' ')}
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          {record.provider ?? record.doctor ?? 'Provider not recorded'}
                          {' · '}
                          {record.processingStatus}
                        </AppText>
                      </View>
                    </View>
                  );
                })
              ) : (
                <AppText color="secondary" style={styles.healthEmptyText}>
                  No health records yet. Upload a lab report or prescription to
                  get started.
                </AppText>
              )}
            </View>
          </Stack>
        )}
        </Stack>
        <VisitPackSheet
        member={member}
        visible={visitPackVisible}
        onClose={() => setVisitPackVisible(false)}
      />
      <EmergencyInfoSheet
          member={member}
          records={overview?.recentRecords ?? []}
          documents={documents ?? []}
          visible={emergencyVisible}
          onClose={() => setEmergencyVisible(false)}
        />
        {memberFormVisible ? (
          <HealthMemberForm
            onClose={() => setMemberFormVisible(false)}
            onSave={async payload => {
              const created = await healthApi.createMember(payload);
              setMembers(current => [...current, created]);
              setSelectedMember(created.id);
              setMemberFormVisible(false);
              if (resolution) await confirmResolution(created.id);
            }}
          />
        ) : null}
        {resolution && !memberFormVisible ? (
          <Modal visible transparent animationType="slide" onRequestClose={() => setResolution(undefined)}>
            <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim }]}>
              <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface.canvas }]}>
                <AppText variant="heading">Choose a profile</AppText>
                <AppText variant="caption" color="secondary">
                  {resolutionMessage(resolution)}
                </AppText>
                {(resolution.memberMatch.candidates.length
                  ? resolution.memberMatch.candidates
                  : members
                ).map(candidate => (
                  <Button
                    key={candidate.id}
                    title={candidate.name}
                    variant="secondary"
                    disabled={importing}
                    onPress={() => { confirmResolution(candidate.id); }}
                  />
                ))}
                <Button
                  title={
                    resolution.patient?.name
                      ? `Create profile for ${resolution.patient.name}`
                      : 'Create new profile'
                  }
                  disabled={importing}
                  onPress={() => setMemberFormVisible(true)}
                />
                <Button title="Cancel" variant="ghost" onPress={() => setResolution(undefined)} />
              </View>
            </View>
          </Modal>
        ) : null}
        {reminderFormVisible && selectedMember ? (
          <HealthReminderForm
            onClose={() => setReminderFormVisible(false)}
            onSave={async payload => {
              const created = await healthApi.createReminder({
                memberId: selectedMember,
                ...payload,
              });
              setReminders(current => [created, ...current]);
              setReminderFormVisible(false);
            }}
          />
        ) : null}
        {metricPickerVisible && member ? (
          <MetricPickerModal
            memberName={member.name}
            memberId={member.id}
            onClose={() => setMetricPickerVisible(false)}
            onChanged={() => refreshMemberData(member.id)}
          />
        ) : null}
        {medicationFormVisible && member ? (
          <MedicationForm
            memberId={member.id}
            onClose={() => setMedicationFormVisible(false)}
            onCreated={async () => {
              setMedicationFormVisible(false);
              await refreshMemberData(member.id);
            }}
          />
        ) : null}
        {readingFormVisible && member ? (
  <HealthReadingForm
    memberId={member.id}
    memberName={member.name}
    onClose={() => setReadingFormVisible(false)}
    onCreated={async () => {
      setReadingFormVisible(false);
      await refreshMemberData(member.id);
    }}
  />
) : null}
      </Stack>
    </Screen>
  );
}
