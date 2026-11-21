import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation,type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React,{ useEffect,useState } from 'react';
import {
Alert,
BackHandler,
Modal,
Platform,
Pressable,
ScrollView,
View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
Activity,
CalendarClock,
FlaskConical,
Pill,
Image as ImageIcon,
Camera,
FileText,
ChevronLeft,
ChevronDown,
UserRound,
} from 'lucide-react-native';


import {
healthApi,
isMemberResolution,
type HealthHomeReminder,
type HealthMember,
type HealthMemberResolution,
type HealthMeasurement,
type HealthOverview,
type HealthRecord,
type HealthRecordDetail,
type HealthTimelineEvent
} from '../../api/health.api';
import type { MainTabParamList,RootStackParamList } from '../../app/navigation/types';
import { useDocumentsQuery } from '../../services/api';
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
HealthDocumentSavedError,
importHealthRecord,
resolutionMessage,
saveHealthRecordAnalysis,
type HealthDocumentType,
type HealthImportResult,
} from './healthRecordImport';
import type { DocumentAnalysisResponse } from '../../api/types';
import type { HealthUploadReview } from '../../api/healthExtraction';
import { healthRecordProcessingMessage } from './healthRecordStatus';
import { PrescriptionReviewSheet } from './components/PrescriptionReviewSheet';
import { DocumentPreview } from '../documents/DocumentPreview';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import { SkeletonList } from '../../components/feedback/SkeletonList';
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
import { saveReminderSchedule, syncReminderNotifications } from '../../notifications/reminderNotifications';
import { HealthReadingForm } from './components/HealthForms';
import { HealthReminderForm } from './components/HealthReminderForm';
import { MedicationForm } from './components/MedicationForm';
import { HealthTabs } from './components/HealthNavigation';
import { EmergencyInfoSheet } from './components/EmergencyInfoSheet';
import { InsuranceCardSheet } from './components/InsuranceCardSheet';
import { VisitPackSheet } from './components/VisitPackSheet';
import { MedicalReadiness } from './components/HealthPanels';
import { EditCareProfileSheet } from './components/EditCareProfileSheet';
import { Header } from './components/MemberComponents';
import { HealthDashboard } from './components/HealthDashboard';
import { HealthRecords } from './components/HealthRecords';
import { HealthReadings } from './components/HealthReadings';
import { HealthMedicines } from './components/HealthMedicines';
import { ReadingDetail } from './components/ReadingDetail';
import { FamilySwitcherSheet } from './components/FamilySwitcherSheet';
import { isDefaultProfile, ManageFamily } from './components/ManageFamily';
import { FamilyMemberForm } from './components/FamilyMemberForm';
import { RemoveFamilyProfile } from './components/RemoveFamilyProfile';
import { sizes } from '../../design/tokens/sizes';
import { styles } from './healthStyles';
import { ReadingView } from './healthTypes';
import { filterChosenReadings, readingViews, withMeasurement, withTrackedMeasurement } from './readingData';
import { deleteMemberWithDocuments } from './memberRemoval';
import { formatDate } from '../../utils/format';

export function HealthScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Health'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [members, setMembers] = useState<HealthMember[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [overview, setOverview] = useState<HealthOverview>();
  const [memberRecords, setMemberRecords] = useState<{ memberId: string; records: HealthRecord[] }>();
  const [allReadings, setAllReadings] = useState<{
    memberId: string;
    loading: boolean;
    measurements: HealthMeasurement[];
    error?: string;
  }>();
  const [readingRefresh, setReadingRefresh] = useState(0);
  const memberRequest = React.useRef(0);
  const { data: documents, refetch: refetchDocuments } = useDocumentsQuery();
  const [insuranceVisible, setInsuranceVisible] = useState(false);
  const [timeline, setTimeline] = useState<HealthTimelineEvent[]>([]);
  const [reminders, setReminders] = useState<HealthHomeReminder[]>([]);
  const remindersRef = React.useRef<HealthHomeReminder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [healthError, setHealthError] = useState<string>();
  const [recordSourceVisible, setRecordSourceVisible] = useState(false);
  const [memberSelectorVisible, setMemberSelectorVisible] = useState(false);
  const [familyDetailId, setFamilyDetailId] = useState<string>();
  const [familyContacts, setFamilyContacts] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [removalTarget, setRemovalTarget] = useState<HealthMember>();
  const pendingFamilyAction = React.useRef<(() => void) | undefined>(undefined);
  const [memberFormVisible, setMemberFormVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<HealthMember>();
  const [editingIdentity, setEditingIdentity] = useState<HealthMember>();
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [visitPackVisible, setVisitPackVisible] = useState(false);
  const [reminderFormVisible, setReminderFormVisible] = useState(false);
  const [metricPickerVisible, setMetricPickerVisible] = useState(false);
  const [medicationFormVisible, setMedicationFormVisible] = useState(false);
  const [updatingMedicationId, setUpdatingMedicationId] = useState<string>();
  const [addHealthVisible, setAddHealthVisible] = useState(false);
  const [readingFormVisible, setReadingFormVisible] = useState(false);
  const [showAllTests, setShowAllTests] = useState(false);
  const [selectedReadingId, setSelectedReadingId] = useState<string>();
  const [importing, setImporting] = useState(false);
  const [resolution, setResolution] = useState<HealthMemberResolution>();
  const [previewDocumentId, setPreviewDocumentId] = useState<string>();
  const [prescriptionReview, setPrescriptionReview] = useState<{
    selected: SelectedDocument;
    analysis: DocumentAnalysisResponse;
    options: { memberId?: string; type?: HealthDocumentType; aiConsent: boolean };
  }>();

  const [
    activeTab,
    setActiveTab,
  ] = useState('Overview');
  const selectedMemberRef = React.useRef(selectedMember);
  selectedMemberRef.current = selectedMember;

  const refreshMemberData = async (memberId: string) => {
    const requestId = ++memberRequest.current;
    const [nextOverview, nextTimeline, records] = await Promise.all([
      healthApi.overview(memberId),
      healthApi.timeline(memberId),
      healthApi.records(memberId),
    ]);
    if (memberRequest.current !== requestId) return;
    setOverview(nextOverview);
    setTimeline(nextTimeline);
    setMemberRecords({ memberId, records });
    setReadingRefresh(version => version + 1);
  };

  const refreshAll = async () => {
    try {
      const [loadedMembers, loadedReminders] = await Promise.all([
        healthApi.members(),
        healthApi.reminders(),
      ]);
      setMembers(loadedMembers);
      remindersRef.current = loadedReminders;
      setReminders(loadedReminders);
      syncReminderNotifications(loadedReminders).catch(error => console.warn('Unable to schedule reminders', error));
      const memberId = selectedMember || loadedMembers[0]?.id;
      if (memberId && !selectedMember) setSelectedMember(memberId);
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

  // Records can be added from Documents while this tab stays mounted, so reload on return.
  const hasFocusedOnce = React.useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (hasFocusedOnce.current) void refreshAll();
      hasFocusedOnce.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMember]),
  );
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab !== 'Records' && activeTab !== 'Readings' && activeTab !== 'Medications' && activeTab !== 'Family') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeTab === 'Family' && (familyDetailId || familyContacts)) {
          setFamilyDetailId(undefined);
          setFamilyContacts(false);
        } else if (activeTab === 'Family') setActiveTab('Overview');
        else if (activeTab === 'Readings' && selectedReadingId) setSelectedReadingId(undefined);
        else setActiveTab('Overview');
        return true;
      });
      return () => subscription.remove();
    }, [activeTab, selectedReadingId, familyDetailId, familyContacts]),
  );

  useEffect(() => {
    let active = true;
    Promise.all([healthApi.members(), healthApi.reminders()])
      .then(([loadedMembers, loadedReminders]) => {
        if (!active) return;
        setMembers(loadedMembers);
        remindersRef.current = loadedReminders;
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
    const requestId = ++memberRequest.current;
    setOverview(undefined);
    setTimeline([]);
    setMemberRecords(undefined);
    setLoadingOverview(true);
    Promise.all([
      healthApi.overview(selectedMember),
      healthApi.timeline(selectedMember),
      healthApi.records(selectedMember),
    ])
      .then(([loadedOverview, loadedTimeline, loadedRecords]) => {
        if (!active || memberRequest.current !== requestId) return;
        setOverview(loadedOverview);
        setTimeline(loadedTimeline);
        setMemberRecords({ memberId: selectedMember, records: loadedRecords });
      })
      .catch(loadError => {
        if (active && memberRequest.current === requestId) {
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

  useEffect(() => {
    if (activeTab !== 'Readings' || !selectedMember) return;
    let active = true;
    setAllReadings(current => current?.memberId === selectedMember
      ? { ...current, loading: true, error: undefined }
      : { memberId: selectedMember, loading: true, measurements: [] });
    healthApi.measurements(selectedMember)
      .then(measurements => {
        if (active) setAllReadings({ memberId: selectedMember, loading: false, measurements });
      })
      .catch(error => {
        if (active) {
          setAllReadings(current => ({
            memberId: selectedMember,
            loading: false,
            measurements: current?.memberId === selectedMember ? current.measurements : [],
            error: error instanceof Error ? error.message : 'Unable to load readings.',
          }));
        }
      });
    return () => { active = false; };
  }, [activeTab, selectedMember, readingRefresh]);

  const member =
    members.find(
      item => item.id === selectedMember,
    );

  const currentOverview = overview?.member.id === selectedMember ? overview : undefined;
  const fullReadings = React.useMemo(
    () => allReadings?.memberId === selectedMember ? readingViews(allReadings.measurements) : [],
    [allReadings, selectedMember],
  );
  const chosenTests = React.useMemo(() => currentOverview?.trackedMetrics ?? [], [currentOverview]);
  const visibleReadings = React.useMemo(
    () => showAllTests ? fullReadings : filterChosenReadings(fullReadings, chosenTests),
    [fullReadings, chosenTests, showAllTests],
  );
  const selectedReading = fullReadings.find(item => item.id === selectedReadingId);
  const readings: ReadingView[] = (currentOverview?.trackedMetrics ?? [])
    .filter(metric => metric.latest)
    .map(metric => {
      const latest = metric.latest!;
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
          : latest.referenceMin != null || latest.referenceMax != null
            ? 'within reference range'
            : latest.referenceText ? 'reference range on file' : 'no range on file',
        range:
          latest.referenceText ??
          (latest.referenceMin != null && latest.referenceMax != null
            ? `${latest.referenceMin}–${latest.referenceMax}`
            : latest.referenceMax != null
            ? `under ${latest.referenceMax}`
            : latest.referenceMin != null
              ? `over ${latest.referenceMin}`
              : undefined),
        measurements: metric.measurements,
        color: outsideRange ? 'danger' : 'primary',
        sourceName: latest.originalName,
        measuredAt: latest.measuredAt,
      };
    });

  const toggleMedication = async (id: string, stopped: boolean) => {
    const memberId = selectedMember;
    setUpdatingMedicationId(id);
    try {
      await healthApi.updateMedication(id, {
        status: stopped ? 'continuing' : 'stopped',
        stoppedAt: stopped ? null : new Date().toISOString(),
      });
      if (selectedMemberRef.current === memberId) {
        try {
          await refreshMemberData(memberId);
        } catch (error) {
          setHealthError(`The medicine was updated, but Health could not be refreshed: ${error instanceof Error ? error.message : 'Please refresh.'}`);
        }
      }
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Unable to update medication.');
    } finally {
      setUpdatingMedicationId(undefined);
    }
  };

  const showImportedRecord = async (record: HealthRecordDetail) => {
    setSelectedMember(record.memberId);
    await refreshMemberData(record.memberId);
    setActiveTab(record.type === 'prescription' ? 'Medications' : 'Records');
    Alert.alert(
      'Health record added',
      healthRecordProcessingMessage(record) ??
        (record.measurements.length
          ? `${record.measurements.length} measurement(s) were extracted.`
          : 'Health record saved. Review it for any missing information.'),
    );
  };

  const handleImportedRecord = async (result: Exclude<HealthImportResult, { kind: 'review' }>) => {
    if (result.kind === 'resolution') {
      setResolution(result.resolution);
      Alert.alert('Choose a profile', resolutionMessage(result.resolution));
    } else {
      await showImportedRecord(result.record);
    }
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
      const options = { memberId, type, aiConsent };
      const result = await importHealthRecord(selected, options);
      if (result.kind === 'review') {
        setPrescriptionReview({ selected, analysis: result.analysis, options });
      } else {
        await handleImportedRecord(result);
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

  const saveReviewedPrescription = async (review: HealthUploadReview) => {
    if (!prescriptionReview) throw new Error('The prescription review is no longer available.');
    let result: HealthImportResult;
    try {
      result = await saveHealthRecordAnalysis(
        prescriptionReview.selected, prescriptionReview.options, prescriptionReview.analysis, review,
      );
    } catch (error) {
      if (error instanceof HealthDocumentSavedError) {
        setPrescriptionReview(undefined);
        setHealthError(error.message);
        return;
      }
      throw error;
    }
    if (result.kind === 'review') throw new Error('The prescription could not be saved.');
    setPrescriptionReview(undefined);
    try {
      await handleImportedRecord(result);
    } catch (error) {
      setHealthError(`The prescription was saved, but Health could not be refreshed: ${error instanceof Error ? error.message : 'Please refresh.'}`);
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
      if (isMemberResolution(record)) {
        throw new Error('A health profile still needs to be selected.');
      }
      setResolution(undefined);
      await showImportedRecord(record);
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

  const runPendingFamilyAction = () => {
    const action = pendingFamilyAction.current;
    pendingFamilyAction.current = undefined;
    action?.();
  };
  const switchFamilySheet = (close: () => void, next: () => void) => {
    if (Platform.OS === 'ios') {
      pendingFamilyAction.current = next;
      close();
    } else {
      close();
      next();
    }
  };

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={refreshAll}
floatingAction={
  <>
    {activeTab !== 'Medications' && activeTab !== 'Family' ? <FloatingActionButton
      accessibilityLabel="Add to Health"
      onPress={() => setAddHealthVisible(true)}
    /> : null}
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
    <FamilySwitcherSheet
      visible={memberSelectorVisible}
      members={members}
      selected={selectedMember}
      onClose={() => setMemberSelectorVisible(false)}
      onDismiss={runPendingFamilyAction}
      onSelect={id => {
        setSelectedReadingId(undefined);
        setSelectedMember(id);
        setMemberSelectorVisible(false);
      }}
      onManageFamily={() => switchFamilySheet(
        () => setMemberSelectorVisible(false),
        () => { setFamilyDetailId(undefined); setFamilyContacts(false); setActiveTab('Family'); },
      )}
    />
      <AddToHealthSheet
        visible={addHealthVisible}
        onDismiss={runPendingFamilyAction}
        memberName={member?.name ?? 'your profile'}
        onClose={() => setAddHealthVisible(false)}
        onRecord={() => {
          setAddHealthVisible(false);
          setRecordSourceVisible(true);
        }}
        onReading={() => {
          if (!member) {
            Alert.alert('Health profile required', 'Add a health profile before logging a reading.');
            return;
          }
          switchFamilySheet(() => setAddHealthVisible(false), () => setReadingFormVisible(true));
        }}
        onReminder={() => {
          if (!member) {
            Alert.alert('Health profile required', 'Add a health profile before creating a reminder.');
            return;
          }
          switchFamilySheet(() => setAddHealthVisible(false), () => setReminderFormVisible(true));
        }}
        onMedicine={() => {
          if (!member) {
            Alert.alert('Health profile required', 'Add a health profile before adding a medicine.');
            return;
          }
          switchFamilySheet(() => setAddHealthVisible(false), () => setMedicationFormVisible(true));
        }}
        onFamilyMember={() => {
          setAddHealthVisible(false);
          setMemberFormVisible(true);
        }}
      />
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

        {activeTab === 'Records' || activeTab === 'Readings' || activeTab === 'Medications' || activeTab === 'Family' ? (
          <Row align="center" style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={activeTab === 'Family' && (familyDetailId || familyContacts) ? 'Back to manage family' : activeTab === 'Readings' && selectedReadingId ? 'Back to readings' : 'Back to health overview'}
              onPress={() => {
                if (activeTab === 'Family' && (familyDetailId || familyContacts)) { setFamilyDetailId(undefined); setFamilyContacts(false); }
                else if (activeTab === 'Readings' && selectedReadingId) setSelectedReadingId(undefined);
                else setActiveTab('Overview');
              }}
              style={styles.formClose}
            >
              <ChevronLeft size={sizes.icon.md} color={theme.colors.icon.primary} />
            </Pressable>
            <AppText variant="overviewTitle" numberOfLines={1}>
              {activeTab === 'Family' ? familyDetailId ? 'Family profile' : familyContacts ? 'Emergency contacts' : 'Manage family' : activeTab === 'Readings' && selectedReadingId ? selectedReading?.title ?? 'Reading history' : activeTab === 'Medications' ? 'Medicines' : activeTab}
            </AppText>
          </Row>
        ) : <Header />}
        {healthError ? (
          <AppText variant="caption" color="danger">
            {healthError}
          </AppText>
        ) : null}
        <ProcessingOverlay visible={importing} label="Processing health record…" />

        {/* FAMILY MEMBERS */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose health profile"
          accessibilityState={{ expanded: memberSelectorVisible }}
          onPress={() => setMemberSelectorVisible(true)}
          style={styles.memberContext}
        >
          <UserRound size={sizes.icon.sm} color={theme.colors.icon.interactive} />
          <AppText variant="caption" numberOfLines={1} style={[styles.memberContextName, { color: theme.colors.text.interactive }]}>
            {member ? `${member.name} · ${member.relation}` : 'Choose profile'}
          </AppText>
          <ChevronDown size={sizes.icon.sm} color={theme.colors.icon.interactive} />
          <AppText variant="caption" color="muted" style={styles.memberContextHint}>
            Private health vault
          </AppText>
        </Pressable>
        </Stack>

        {loadingMembers || (loadingOverview && activeTab !== 'Family') ? <SkeletonList label="Loading health…" /> : null}

        {!member && !loadingMembers ? (
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
        ) : null}

        <Stack gap="md" style={loadingMembers || (loadingOverview && activeTab !== 'Family') || (!member && activeTab !== 'Family') ? styles.hidden : undefined}>
        {/* TABS */}

        {activeTab !== 'Overview' && activeTab !== 'Records' && activeTab !== 'Readings' && activeTab !== 'Medications' && activeTab !== 'Family' ? <HealthTabs
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
        /> : null}

        {activeTab ===
        'Overview' ? (
          member ? <HealthDashboard
            member={member}
            overview={currentOverview}
            records={memberRecords?.memberId === member.id ? memberRecords.records : undefined}
            documents={documents}
            readings={readings}
            onNavigate={setActiveTab}
            onEditProfile={() => setEditingMember(member)}
            onEditIdentity={() => setEditingIdentity(member)}
            onManageFamily={() => { setFamilyDetailId(undefined); setFamilyContacts(false); setActiveTab('Family'); }}
            onPreview={setPreviewDocumentId}
            onVisit={() => setVisitPackVisible(true)}
            onInsurance={() => setInsuranceVisible(true)}
            onEmergency={() => setEmergencyVisible(true)}
            onAddReminder={() => setReminderFormVisible(true)}
          /> : null
        ) : activeTab === 'Family' ? (
          <ManageFamily members={members} selectedId={selectedMember} detailId={familyDetailId} contacts={familyContacts}
            busy={removingMember} onView={setFamilyDetailId} onContacts={() => setFamilyContacts(true)}
            onEdit={setEditingMember} onEditIdentity={setEditingIdentity} onAdd={() => setMemberFormVisible(true)}
            onRemove={setRemovalTarget}
          />
        ) : activeTab === 'Readings' ? (
          <>
          <HealthReadings
            key={selectedMember}
            readings={visibleReadings}
            scope={chosenTests.length ? { total: fullReadings.length, showingAll: showAllTests, onToggle: () => setShowAllTests(value => !value) } : undefined}
            visible={!selectedReadingId}
            loading={allReadings?.memberId !== selectedMember || allReadings.loading}
            error={allReadings?.memberId === selectedMember ? allReadings.error : undefined}
            onRetry={() => setReadingRefresh(version => version + 1)}
            onChooseTests={() => setMetricPickerVisible(true)}
            onAddReading={() => setReadingFormVisible(true)}
            onSelectReading={setSelectedReadingId}
            readiness={
              <MedicalReadiness
                member={member}
                records={memberRecords && member && memberRecords.memberId === member.id ? memberRecords.records : undefined}
                onEdit={() => setEditingMember(member)}
              />
            }
          />
          {selectedReadingId && selectedReading ? (
            <>
              {allReadings?.error ? (
                <Pressable accessibilityRole="button" onPress={() => setReadingRefresh(version => version + 1)}>
                  <AppText color="danger">{allReadings.error} Tap to retry.</AppText>
                </Pressable>
              ) : null}
              <ReadingDetail
                key={selectedReading.id}
                reading={selectedReading}
                onPreview={setPreviewDocumentId}
                onAddReading={() => setReadingFormVisible(true)}
              />
            </>
          ) : selectedReadingId && allReadings?.loading ? (
            <SkeletonList label="Loading reading history…" />
          ) : selectedReadingId && allReadings?.error ? (
            <Pressable accessibilityRole="button" onPress={() => setReadingRefresh(version => version + 1)}>
              <AppText color="danger">{allReadings.error} Tap to retry.</AppText>
            </Pressable>
          ) : selectedReadingId ? (
            <AppText color="secondary">This reading is no longer available. Go back to the readings list.</AppText>
          ) : null}
          </>
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
          <HealthMedicines
            key={selectedMember}
            timeline={currentOverview ? timeline : undefined}
            records={memberRecords?.memberId === selectedMember ? memberRecords.records : undefined}
            updatingId={updatingMedicationId}
            onAdd={() => setMedicationFormVisible(true)}
            onPreview={setPreviewDocumentId}
            onToggle={(id, stopped) => {
              if (stopped) {
                toggleMedication(id, true);
              } else {
                Alert.alert('Mark medicine as stopped?', 'This changes the recorded status only. Follow your doctor’s instructions.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Mark stopped', onPress: () => { toggleMedication(id, false); } },
                ]);
              }
            }}
          />
        ) : (
          <HealthRecords
            key={selectedMember}
            records={memberRecords?.memberId === selectedMember ? memberRecords.records : undefined}
            documents={documents}
            onUpload={() => setRecordSourceVisible(true)}
            onPreview={setPreviewDocumentId}
          />
        )}
        </Stack>
        <VisitPackSheet
        member={member}
        visible={visitPackVisible}
        onClose={() => setVisitPackVisible(false)}
      />
      <InsuranceCardSheet
        visible={insuranceVisible}
        records={overview?.recentRecords ?? []}
        documents={documents ?? []}
        onClose={() => setInsuranceVisible(false)}
        onAddDocument={() => {
          setInsuranceVisible(false);
          navigation.navigate('Documents');
        }}
      />
      <EmergencyInfoSheet
          member={member}
          records={overview?.recentRecords ?? []}
          documents={documents ?? []}
          visible={emergencyVisible}
          onClose={() => setEmergencyVisible(false)}
        />
        {previewDocumentId ? (
         <DocumentPreview documentId={previewDocumentId} onClose={() => setPreviewDocumentId(undefined)} />
        ) : null}
        {editingMember ? (
          <EditCareProfileSheet
            member={editingMember}
            members={members}
            onClose={() => setEditingMember(undefined)}
            onSave={async payload => {
              const updated = await healthApi.updateMember(editingMember.id, payload);
              setMembers(current => current.map(item => item.id === updated.id ? updated : item));
              setEditingMember(undefined);
            }}
          />
        ) : null}
        {editingIdentity ? (
          <FamilyMemberForm member={editingIdentity} onClose={() => setEditingIdentity(undefined)}
            onSave={async payload => {
              const updated = await healthApi.updateMember(editingIdentity.id, payload);
              setMembers(current => current.map(item => item.id === updated.id ? updated : item));
              setEditingIdentity(undefined);
            }} />
        ) : null}
        {removalTarget ? (
          <RemoveFamilyProfile member={removalTarget} onClose={() => setRemovalTarget(undefined)}
            onRemove={async () => {
              if (isDefaultProfile(removalTarget)) throw new Error('The default health profile cannot be removed.');
              setRemovingMember(true);
              try {
                const documentError = await deleteMemberWithDocuments(removalTarget.id);
                refetchDocuments();
                setMembers(current => current.filter(item => item.id !== removalTarget.id));
                setFamilyDetailId(undefined);
                if (selectedMember === removalTarget.id) {
                  setSelectedReadingId(undefined);
                  setSelectedMember(members.find(item => item.id !== removalTarget.id)?.id ?? '');
                }
                const remaining = remindersRef.current.filter(item => item.memberId !== removalTarget.id);
                remindersRef.current = remaining;
                setReminders(remaining);
                setRemovalTarget(undefined);
                try {
                  await syncReminderNotifications(remaining);
                } catch (reason) {
                  console.warn('Unable to update reminders after profile removal', reason);
                  setHealthError('Profile removed, but local reminder notifications could not be updated. Check notification settings and refresh Health.');
                }
                if (documentError) setHealthError(`Profile removed, but its documents could not be deleted: ${documentError} Delete them from Documents.`);
              } finally {
                setRemovingMember(false);
              }
            }} />
        ) : null}
        {prescriptionReview?.analysis.document.healthExtraction ? (
          <PrescriptionReviewSheet
            extraction={prescriptionReview.analysis.document.healthExtraction}
            onClose={() => setPrescriptionReview(undefined)}
            onSave={saveReviewedPrescription}
          />
        ) : null}
        {memberFormVisible ? (
          <FamilyMemberForm
            managerName={member?.name}
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
          <Modal visible transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setResolution(undefined)}>
            <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
              <ScrollView style={[styles.modalPanel, styles.resolutionScroll, { backgroundColor: theme.colors.surface.canvas }]}
                contentContainerStyle={[styles.resolutionContent, { paddingBottom: Math.max(8, insets.bottom) }]}>
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
              </ScrollView>
            </View>
          </Modal>
        ) : null}
        {reminderFormVisible && member ? (
          <HealthReminderForm
            memberName={member.name}
            onClose={() => setReminderFormVisible(false)}
            onSave={async payload => {
              const { time, ...serverPayload } = payload;
              const created = await healthApi.createReminder({
                memberId: member.id,
                ...serverPayload,
              });
              const next = [{ ...created, memberId: member.id, memberName: member.name }, ...remindersRef.current];
              remindersRef.current = next;
              setReminders(next);
              try {
                await saveReminderSchedule({ id: created.id, startDate: payload.dueDate, time, frequency: payload.frequency });
                await syncReminderNotifications(next, created.id);
                return undefined;
              } catch (reason) {
                return `Reminder saved, but its notification could not be scheduled: ${reason instanceof Error ? reason.message : 'Please check device settings.'}`;
              }
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
            memberName={member.name}
            onClose={() => setMedicationFormVisible(false)}
            onCreated={async () => {
              setMedicationFormVisible(false);
              try {
                await refreshMemberData(member.id);
              } catch (error) {
                setHealthError(`The medicine was saved, but Health could not be refreshed: ${error instanceof Error ? error.message : 'Please refresh.'}`);
              }
            }}
          />
        ) : null}
        {readingFormVisible && member ? (
  <HealthReadingForm
    memberId={member.id}
    memberName={member.name}
    initialMeasurement={activeTab === 'Readings' && selectedReadingId ? selectedReading?.measurements[0] : undefined}
    onClose={() => setReadingFormVisible(false)}
    onCreated={async created => {
      setReadingFormVisible(false);
      setAllReadings(current => current?.memberId === member.id
        ? { ...current, measurements: withMeasurement(current.measurements, created) }
        : current);
      setOverview(current => current?.member.id === member.id ? withTrackedMeasurement(current, created) : current);
      try {
        await refreshMemberData(member.id);
      } catch (error) {
        setHealthError(`The reading was saved, but Health could not be refreshed: ${error instanceof Error ? error.message : 'Please refresh.'}`);
      }
    }}
  />
) : null}
      </Stack>
    </Screen>
  );
}
