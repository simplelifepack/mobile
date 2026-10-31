import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  useFocusEffect,
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  packageSourceLinks,
  sourceHostname,
  sourceProviderName,
} from './packageSource';
import { ChangeDocumentSheet } from './ChangeDocumentSheet';
import { CustomPackBottomSheet } from './CustomPackBottomSheet';
import { packagesApi } from '../../api/packages.api';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import Svg, { Circle } from 'react-native-svg';

import {
  Car,
  Check,
  ChevronRight,
  Contact,
  Download,
  FolderOpen,
  HeartPulse,
  Package as PackageIcon,
  Plane,
  RefreshCw,
  Search,
  Shield,
  Upload,
  WalletCards,
  X,
} from 'lucide-react-native';

import {
  useDocumentsQuery,
  useAssignRequirementDocumentMutation,
  useClearRequirementDocumentMutation,
  useRefreshPackageMutation,
  useCreateCustomPackageMutation,
  useGeneratePackageMutation,
  usePackageDetailQuery,
  usePackagesQuery,
} from '../../services/api';

import { Screen } from '../../components/primitives/Screen';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';

import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { useAppSelector } from '../../app/store/hooks';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../app/navigation/types';

import { calculatePackReadiness } from './calculatePackReadiness';

import type { DocumentRecord, PackageSummary } from '../../api/types';

// ============================================================================
// Categories
// ============================================================================

const categories = [
  'All',
  'Travel & Immigration',
  'Identity & Civic',
  'Money & Tax',
  'Jobs & Employment',
  'Education',
  'Health',
  'Home & Property',
  'Family & Life',
  'Custom',
];

// ============================================================================
// Helpers
// ============================================================================

function errorMessage(error: unknown) {
  const value = error as {
    message?: string;
    error?: string;
  };

  return value?.message ?? value?.error ?? 'Unable to load packages.';
}

function readinessColor(
  percentage: number,
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  if (percentage < 40) {
    return theme.colors.danger;
  }

  if (percentage < 80) {
    return theme.colors.warning;
  }

  return theme.colors.success;
}

function formatPackageDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function isPackageSourceStale(value?: string) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return !Number.isNaN(timestamp) && Date.now() - timestamp > 30 * 86_400_000;
}

function getPackageIcon(title: string) {
  const value = title.toLowerCase();

  if (
    value.includes('visa') ||
    value.includes('travel') ||
    value.includes('immigration') ||
    value.includes('stamping')
  ) {
    return Plane;
  }

  if (
    value.includes('driving') ||
    value.includes('licence') ||
    value.includes('license') ||
    value.includes('permit')
  ) {
    return Car;
  }

  if (
    value.includes('passport') ||
    value.includes('identity') ||
    value.includes('kyc') ||
    value.includes('sim')
  ) {
    return Contact;
  }

  if (value.includes('health') || value.includes('medical')) {
    return HeartPulse;
  }

  if (
    value.includes('loan') ||
    value.includes('money') ||
    value.includes('tax')
  ) {
    return WalletCards;
  }

  return PackageIcon;
}

// ============================================================================
// Readiness Ring
// ============================================================================

function ReadinessRing({
  percentage,
  size = 64,
}: {
  percentage: number;
  size?: number;
}) {
  const { theme } = useAppTheme();

  const strokeWidth = size < 56 ? 5 : 6;

  const radius = (size - strokeWidth) / 2;

  const circumference = 2 * Math.PI * radius;

  const progress = Math.max(0, Math.min(100, Math.round(percentage)));

  const dashOffset = circumference - (circumference * progress) / 100;

  const color = readinessColor(progress, theme);

  return (
    <View
      style={[
        styles.readinessRing,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.readinessValue}>
        <AppText align="center" style={styles.readinessNumber}>
          {progress}
        </AppText>
      </View>
    </View>
  );
}

// ============================================================================
// Category Chip
// ============================================================================

function CategoryChip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.categoryChip,
        {
          backgroundColor: selected
            ? theme.colors.surfaceElevated
            : 'transparent',

          borderColor: selected ? theme.colors.primary : theme.colors.border,

          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? 'primary' : 'secondary'}
        style={styles.categoryText}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

// ============================================================================
// Package Card
// ============================================================================

function PackageCard({
  item,
  percentage,
  satisfiedRequired,
  totalRequired,
  onPress,
}: {
  item: PackageSummary;
  percentage: number;
  satisfiedRequired: number;
  totalRequired: number;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  const Icon = getPackageIcon(item.title);

  const isReady = percentage >= 100;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      style={({ pressed }) => [
        styles.packagePressable,
        {
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Card
        style={[
          styles.packageCard,
          {
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {/* Readiness */}

        <ReadinessRing percentage={percentage} size={48} />

        {/* Package information */}

        <View style={styles.packageContent}>
          <Row align="center" gap="sm">
            <View
              style={[
                styles.packageIcon,
                {
                  backgroundColor: theme.colors.surfaceElevated,

                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Icon size={18} color={theme.colors.primary} strokeWidth={2} />
            </View>

            <AppText
              variant="heading"
              numberOfLines={2}
              style={styles.packageTitle}
            >
              {item.title}
            </AppText>
          </Row>

          <AppText
            variant="caption"
            color="secondary"
            numberOfLines={1}
            style={styles.packageStatus}
          >
            {isReady
              ? 'Everything in place'
              : `${satisfiedRequired} of ${totalRequired} ready`}
          </AppText>
        </View>

        {/* Trailing action */}

        {isReady ? (
          <View
            style={[
              styles.readyStamp,
              {
                borderColor: theme.colors.success,
              },
            ]}
          >
            <AppText
              style={[
                styles.readyText,
                {
                  color: theme.colors.success,
                },
              ]}
            >
              READY
            </AppText>
          </View>
        ) : (
          <ChevronRight
            size={20}
            color={theme.colors.textSecondary}
            strokeWidth={2}
          />
        )}
      </Card>
    </Pressable>
  );
}

// ============================================================================
// Package Detail Bottom Sheet
// ============================================================================

function PackageDetailBottomSheet({
  visible,
  selected,
  readiness,
  documents,
  loading,
  error,
  onAssignRequirement,
  onClearRequirement,
  onRefresh,
  onCheckSource,
  onUpload,
  onClose,
}: {
  visible: boolean;
  selected?: PackageSummary;
  readiness: ReturnType<typeof calculatePackReadiness> | null;
  documents: DocumentRecord[];
  loading: boolean;
  error?: unknown;
  onAssignRequirement: (
    requirementId: string,
    documentId: string,
  ) => Promise<unknown>;
  onClearRequirement: (requirementId: string) => Promise<unknown>;
  onRefresh: () => void;
  onCheckSource: () => Promise<string | undefined>;
  onUpload: () => void;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();

  const [editingRequirementId, setEditingRequirementId] = useState<string>();

  const [savingRequirementId, setSavingRequirementId] = useState<string>();

  const [assignmentError, setAssignmentError] = useState<string>();

  const [refreshing, setRefreshing] = useState(false);

  const [refreshNote, setRefreshNote] = useState<{
    message: string;
    error: boolean;
  }>();

  const [addMenuId, setAddMenuId] = useState<string>();

  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  if (!visible) {
    return null;
  }

  const requirements =
    selected && readiness
      ? [...readiness.requirements].sort(
          (left, right) =>
            Number(left.status !== 'ready') - Number(right.status !== 'ready'),
        )
      : [];
  const readyRequirements = requirements.filter(
    item => item.status === 'ready',
  );
  const missingRequirements = requirements.filter(
    item => item.status !== 'ready' && !skippedIds.includes(item.id),
  );
  const skippedRequirements = requirements.filter(
    item => item.status !== 'ready' && skippedIds.includes(item.id),
  );
  const addMenuRequirement = requirements.find(item => item.id === addMenuId);
  const openAfterSheet = (action: () => void) => {
    setAddMenuId(undefined);
    setTimeout(action, 400);
  };
  const downloadable = readyRequirements.filter(item => item.matchedDocument);

  const sourceLinks = packageSourceLinks(selected);

  const sourceCheckedDate = formatPackageDate(
    selected?.source?.lastCheckedAt ??
      selected?.verificationSources?.[0]?.retrievedAt,
  );

  const sourceIsStale = isPackageSourceStale(
    selected?.source?.lastCheckedAt ??
      selected?.verificationSources?.[0]?.retrievedAt,
  );

  const checkSource = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshNote(undefined);
    try {
      const message = await onCheckSource();
      setRefreshNote({
        message: message ?? 'Requirements are up to date.',
        error: false,
      });
    } catch (refreshError) {
      setRefreshNote({ message: errorMessage(refreshError), error: true });
    } finally {
      setRefreshing(false);
    }
  };

  const pickerRequirement = requirements.find(
    item => item.id === editingRequirementId,
  );

  const Icon = selected ? getPackageIcon(selected.title) : PackageIcon;

  const updateRequirement = async (
    requirementId: string,
    action: () => Promise<unknown>,
  ) => {
    setSavingRequirementId(requirementId);
    setAssignmentError(undefined);

    try {
      await action();
      setEditingRequirementId(undefined);
    } catch (updateError) {
      setAssignmentError(errorMessage(updateError));
    } finally {
      setSavingRequirementId(undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        {/* Close when tapping outside */}
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* ================================================================
              Grabber
          ================================================================ */}

          <View style={styles.sheetGrabber} />

          {/* ================================================================
              Header
          ================================================================ */}

          <View
            style={[styles.sheetHeader, { borderBottomColor: 'transparent' }]}
          >
            <View
              style={[
                styles.sheetPackageIcon,
                { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <Icon size={23} color={theme.colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.packageHeaderCopy}>
              <AppText
                variant="title"
                numberOfLines={2}
                style={styles.sheetTitle}
              >
                {selected?.title ?? 'Package'}
              </AppText>
              <AppText
                variant="body"
                color="secondary"
                style={styles.packageSubtitle}
              >
                {selected?.description ??
                  'Documents and requirements for this package'}
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close package details"
              style={[
                styles.sheetCloseButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <X size={21} color={theme.colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* ================================================================
              Content
          ================================================================ */}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {loading && !selected ? (
              <Stack align="center" style={styles.sheetLoading}>
                <LoadingState label="Loading package details…" />
              </Stack>
            ) : null}

            {error && !selected ? (
              <Stack gap="md" style={styles.sheetError}>
                <ErrorState message={errorMessage(error)} />

                <Button title="Retry" variant="secondary" onPress={onRefresh} />
              </Stack>
            ) : null}

            {selected && readiness ? (
              <Stack gap="md">
                <View
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor: theme.colors.surfaceElevated,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppText variant="caption" color="secondary">
                    Source
                  </AppText>
                  <Row align="center" justify="space-between">
                    <View style={styles.sourceLinks}>
                      {sourceLinks.length ? (
                        sourceLinks.map((link, index) => (
                          <Pressable
                            key={`${link.url}-${index}`}
                            accessibilityRole="link"
                            onPress={() => Linking.openURL(link.url)}
                          >
                            <AppText
                              variant="label"
                              color="primary"
                              style={styles.sourceProvider}
                            >
                              {link.name}
                            </AppText>
                          </Pressable>
                        ))
                      ) : (
                        <AppText variant="body" color="secondary">
                          No source saved for this package.
                        </AppText>
                      )}
                    </View>
                    <Pressable
                      onPress={checkSource}
                      disabled={refreshing}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Check again now"
                    >
                      {refreshing ? (
                        <ActivityIndicator color={theme.colors.primary} />
                      ) : (
                        <RefreshCw
                          size={20}
                          color={theme.colors.textSecondary}
                          strokeWidth={2}
                        />
                      )}
                    </Pressable>
                  </Row>
                  <AppText variant="body" color="secondary">
                    Last checked{' '}
                    <AppText variant="body" style={styles.sourceCheckedDate}>
                      {sourceCheckedDate ?? 'Not yet checked'}
                    </AppText>
                  </AppText>
                  {refreshNote ? (
                    <AppText
                      variant="caption"
                      color={refreshNote.error ? 'danger' : 'secondary'}
                    >
                      {refreshNote.message}
                    </AppText>
                  ) : null}
                </View>

                {sourceIsStale ? (
                  <AppText variant="caption" color="danger">
                    These requirements were last checked over 30 days ago.
                  </AppText>
                ) : null}

                <View style={styles.readinessSummaryRow}>
                  <ReadinessRing percentage={readiness.percentage} size={88} />
                  <AppText
                    variant="body"
                    color="secondary"
                    style={styles.readinessSummaryText}
                  >
                    {readiness.satisfiedRequired} of {readiness.totalRequired}{' '}
                    ready
                  </AppText>
                </View>

                {/* ==========================================================
                    Already in your vault
                ========================================================== */}

                <View
                  style={[
                    styles.vaultCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.vaultHeader,
                      {
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Check
                      size={20}
                      color={theme.colors.success}
                      strokeWidth={2.5}
                    />

                    <AppText variant="heading" style={styles.vaultTitle}>
                      Already in your vault ({readyRequirements.length})
                    </AppText>
                  </View>

                  {readyRequirements.map((requirement, index) => {
                    const ready = requirement.status === 'ready';

                    const previous = readyRequirements[index - 1];

                    const editing = editingRequirementId === requirement.id;

                    return (
                      <React.Fragment key={requirement.id}>
                        {previous?.status !== requirement.status ? (
                          <AppText
                            variant="caption"
                            color="secondary"
                            style={styles.requirementGroupHeading}
                          >
                            {ready ? 'Found in Readiness' : 'Still needed'}
                          </AppText>
                        ) : null}

                        <View
                          style={[
                            styles.vaultRow,
                            {
                              borderBottomColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.vaultCheck,
                              {
                                backgroundColor: theme.colors.success + '22',
                              },
                            ]}
                          >
                            {ready ? (
                              <Check
                                size={17}
                                color={theme.colors.success}
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Shield
                                size={17}
                                color={theme.colors.warning}
                                strokeWidth={2}
                              />
                            )}
                          </View>

                          <Stack gap="xs" style={styles.vaultContent}>
                            <Row align="center" justify="space-between">
                              <AppText
                                variant="body"
                                style={styles.requirementTitle}
                              >
                                {requirement.title}
                              </AppText>

                              <ChevronRight
                                size={18}
                                color={theme.colors.textSecondary}
                                strokeWidth={2}
                              />
                            </Row>

                            {requirement.matchedDocument ? (
                              <AppText variant="caption" color="secondary">
                                {requirement.matchedDocument.displayName ??
                                  requirement.matchedDocument.originalName}
                              </AppText>
                            ) : null}

                            <Pressable
                              style={[
                                styles.actionPill,
                                { borderColor: theme.colors.border },
                              ]}
                              onPress={() => {
                                setAssignmentError(undefined);

                                setEditingRequirementId(
                                  editing ? undefined : requirement.id,
                                );
                              }}
                            >
                              <AppText variant="label" color="primary">
                                {editing
                                  ? 'Cancel'
                                  : ready
                                    ? 'Change document'
                                    : 'Choose document'}
                              </AppText>
                            </Pressable>
                          </Stack>
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>

                {missingRequirements.length ? (
                  <View
                    style={[
                      styles.vaultCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.vaultHeader,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <Shield
                        size={20}
                        color={theme.colors.warning}
                        strokeWidth={2}
                      />
                      <AppText variant="heading" style={styles.vaultTitle}>
                        Still needed ({missingRequirements.length})
                      </AppText>
                    </View>

                    {missingRequirements.map(requirement => (
                      <View
                        key={requirement.id}
                        style={[
                          styles.missingRequirementRow,
                          { borderBottomColor: theme.colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.vaultCheck,
                            { backgroundColor: theme.colors.warning + '22' },
                          ]}
                        >
                          <X
                            size={17}
                            color={theme.colors.warning}
                            strokeWidth={2.5}
                          />
                        </View>
                        <View style={styles.missingRequirementCopy}>
                          <AppText
                            variant="body"
                            style={styles.requirementTitle}
                          >
                            {requirement.title}
                          </AppText>
                          {requirement.description ? (
                            <AppText variant="body" color="secondary">
                              {requirement.description}
                            </AppText>
                          ) : null}
                        </View>
                        <Pressable
                          onPress={() => {
                            setAssignmentError(undefined);
                            setAddMenuId(requirement.id);
                          }}
                          accessibilityRole="button"
                          style={[
                            styles.addRequirementButton,
                            { borderColor: theme.colors.primary },
                          ]}
                        >
                          <AppText variant="label" color="primary">
                            Add
                          </AppText>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}

                {skippedRequirements.length ? (
                  <View
                    style={[
                      styles.vaultCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.vaultHeader,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <X
                        size={20}
                        color={theme.colors.textSecondary}
                        strokeWidth={2}
                      />
                      <AppText variant="heading" style={styles.vaultTitle}>
                        Not needed ({skippedRequirements.length})
                      </AppText>
                    </View>
                    {skippedRequirements.map(requirement => (
                      <View
                        key={requirement.id}
                        style={[
                          styles.missingRequirementRow,
                          { borderBottomColor: theme.colors.border },
                        ]}
                      >
                        <View style={styles.missingRequirementCopy}>
                          <AppText
                            variant="body"
                            style={styles.requirementTitle}
                          >
                            {requirement.title}
                          </AppText>
                        </View>
                        <Pressable
                          onPress={() =>
                            setSkippedIds(ids =>
                              ids.filter(id => id !== requirement.id),
                            )
                          }
                          accessibilityRole="button"
                          style={[
                            styles.addRequirementButton,
                            { borderColor: theme.colors.primary },
                          ]}
                        >
                          <AppText variant="label" color="primary">
                            Need it after all
                          </AppText>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View
                  style={[
                    styles.vaultCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.vaultHeader,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <Download
                      size={20}
                      color={theme.colors.textSecondary}
                      strokeWidth={2}
                    />
                    <AppText variant="heading" style={styles.vaultTitle}>
                      In this download
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      {downloadable.length}
                    </AppText>
                  </View>
                  {downloadable.map(requirement => (
                    <View
                      key={requirement.id}
                      style={[
                        styles.downloadDocumentRow,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <View style={styles.downloadCheckbox}>
                        <Check size={17} color="#17151D" strokeWidth={3} />
                      </View>
                      <View style={styles.downloadDocumentCopy}>
                        <AppText variant="body">{requirement.title}</AppText>
                        <AppText variant="caption" color="secondary">
                          {requirement.matchedDocument?.displayName ??
                            requirement.matchedDocument?.originalName ??
                            'Document selected'}
                        </AppText>
                      </View>
                    </View>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Alert.alert(
                        'Download not connected',
                        'Connect this button to your document bundle/export API.',
                      );
                    }}
                    style={[
                      styles.downloadAction,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Download size={20} color="#17151D" strokeWidth={2.5} />
                    <AppText variant="label" style={styles.downloadActionText}>
                      Download
                    </AppText>
                  </Pressable>
                </View>

                {/* ==========================================================
                    Official source
                ========================================================== */}

                {selected.verificationSources?.length ? (
                  <View
                    style={[
                      styles.vaultCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.vaultHeader,
                        { borderBottomColor: theme.colors.border },
                      ]}
                    >
                      <AppText variant="heading" style={styles.vaultTitle}>
                        Sources
                      </AppText>
                    </View>
                    {selected.verificationSources.slice(0, 4).map(source => (
                      <Pressable
                        key={`${source.title}-${source.url}`}
                        accessibilityRole="link"
                        onPress={() => Linking.openURL(source.url)}
                        style={[
                          styles.missingRequirementRow,
                          { borderBottomColor: theme.colors.border },
                        ]}
                      >
                        <View style={styles.missingRequirementCopy}>
                          <AppText variant="label" color="primary">
                            {sourceProviderName(source)}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {[
                              source.title,
                              sourceHostname(source.url),
                              `checked ${formatPackageDate(source.retrievedAt) ?? 'recently'}`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                      </Pressable>
                    ))}
                    <AppText
                      variant="caption"
                      color="secondary"
                      style={styles.sourcesNote}
                    >
                      Sources help verify the checklist, but institutions can
                      still ask for more.
                    </AppText>
                  </View>
                ) : selected.source?.url ? (
                  <Button
                    title={sourceLinks[0]?.name ?? 'Open official source'}
                    variant="secondary"
                    onPress={() => Linking.openURL(selected.source!.url!)}
                  />
                ) : null}

                {/* ==========================================================
                    Disclaimer
                ========================================================== */}

                <AppText
                  variant="caption"
                  color="secondary"
                  align="center"
                  style={styles.sheetDisclaimer}
                >
                  Checklist based on published requirements; completeness and
                  eligibility are not guaranteed.
                </AppText>
              </Stack>
            ) : null}
          </ScrollView>
        </View>
      </View>
      <ActionSheet
        visible={Boolean(addMenuRequirement)}
        title={addMenuRequirement?.title ?? 'Add document'}
        onClose={() => setAddMenuId(undefined)}
        options={
          addMenuRequirement
            ? [
                {
                  label: 'Upload',
                  icon: Upload,
                  onPress: () => {
                    setAddMenuId(undefined);
                    onUpload();
                  },
                },
                {
                  label: 'Pick from Documents',
                  icon: FolderOpen,
                  onPress: () =>
                    openAfterSheet(() => {
                      setAssignmentError(undefined);
                      setEditingRequirementId(addMenuRequirement.id);
                    }),
                },
                {
                  label: 'Not needed',
                  icon: X,
                  onPress: () => {
                    setSkippedIds(ids => [...ids, addMenuRequirement.id]);
                    setAddMenuId(undefined);
                  },
                },
              ]
            : []
        }
      />
      {pickerRequirement ? (
        <ChangeDocumentSheet
          requirement={pickerRequirement}
          documents={documents}
          busy={savingRequirementId === pickerRequirement.id}
          error={assignmentError}
          onAssign={document =>
            updateRequirement(pickerRequirement.id, () =>
              onAssignRequirement(pickerRequirement.id, document.id),
            )
          }
          onClearAssignment={() =>
            updateRequirement(pickerRequirement.id, () =>
              onClearRequirement(pickerRequirement.id),
            )
          }
          onUpload={() => {
            setEditingRequirementId(undefined);
            onUpload();
          }}
          onClose={() => setEditingRequirementId(undefined)}
        />
      ) : null}
    </Modal>
  );
}

// ============================================================================
// Readiness Screen
// ============================================================================

export function ReadinessScreen() {
  const { theme } = useAppTheme();
  const navigation =
    useNavigation<
      CompositeNavigationProp<
        BottomTabNavigationProp<MainTabParamList, 'Packages'>,
        NativeStackNavigationProp<RootStackParamList>
      >
    >();
  const authStatus = useAppSelector(state => state.auth.status);
  const guestPreview = __DEV__ && authStatus === 'unauthenticated';
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [query, setQuery] = useState('');

  const [submittedQuery, setSubmittedQuery] = useState('');

  const [category, setCategory] = useState('All');

  const [page, setPage] = useState(1);

  const [selectedSlug, setSelectedSlug] = useState<string>();

  const [generated, setGenerated] = useState<PackageSummary | null>(null);
  const [createdCustomPack, setCreatedCustomPack] = useState<PackageSummary>();
  const [customPackVisible, setCustomPackVisible] = useState(false);

  React.useEffect(() => {
    if (guestPreview) {
      setSelectedSlug(undefined);
      setGenerated(null);
      setCustomPackVisible(false);
    }
  }, [guestPreview]);

  React.useEffect(
    () =>
      navigation.addListener('blur', () => {
        setSelectedSlug(undefined);
        setCustomPackVisible(false);
      }),
    [navigation],
  );

  // --------------------------------------------------------------------------
  // API
  // --------------------------------------------------------------------------

  const packageQuery = {
    category: category === 'All' ? undefined : category,

    search: submittedQuery || undefined,

    page,

    limit: 20,
  };

  const packages = usePackagesQuery(packageQuery, { skip: guestPreview });

  const documentsQuery = useDocumentsQuery(undefined, { skip: guestPreview });

  const detail = usePackageDetailQuery(selectedSlug!, {
    skip: !selectedSlug || guestPreview,
  });

  const refetchDocuments = documentsQuery.refetch;
  useFocusEffect(
    useCallback(() => {
      if (!guestPreview) refetchDocuments();
    }, [guestPreview, refetchDocuments]),
  );

  const [generate, generation] = useGeneratePackageMutation();
  const [createCustomPackage] = useCreateCustomPackageMutation();
  const [assignRequirement] = useAssignRequirementDocumentMutation();
  const [refreshPackage] = useRefreshPackageMutation();
  const [clearRequirement] = useClearRequirementDocumentMutation();

  // --------------------------------------------------------------------------
  // Data
  // --------------------------------------------------------------------------

  const documents = useMemo<DocumentRecord[]>(
    () => (guestPreview ? [] : (documentsQuery.data ?? [])),
    [guestPreview, documentsQuery.data],
  );

  const items = useMemo<PackageSummary[]>(() => {
    if (guestPreview) return [];
    if (generated) return [generated];

    const listed = packages.data?.items ?? [];
    const shouldShowRecentCustom = category === 'All' || category === 'Custom';
    if (
      shouldShowRecentCustom &&
      createdCustomPack &&
      !listed.some(item => item.slug === createdCustomPack.slug)
    ) {
      return [createdCustomPack, ...listed];
    }
    return listed;
  }, [
    category,
    createdCustomPack,
    generated,
    guestPreview,
    packages.data?.items,
  ]);

  const cards = useMemo(
    () =>
      items.map(item => ({
        item,

        readiness: calculatePackReadiness(item.requirements, documents),
      })),
    [documents, items],
  );

  const selected = guestPreview
    ? undefined
    : (detail.data ?? items.find(item => item.slug === selectedSlug));

  const selectedReadiness = selected
    ? calculatePackReadiness(selected.requirements, documents)
    : null;

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  const search = () => {
    setGenerated(null);
    setPage(1);

    setSubmittedQuery(query.trim());

    setSelectedSlug(undefined);
  };

  // --------------------------------------------------------------------------
  // Generate missing package
  // --------------------------------------------------------------------------

  const generateMissing = async () => {
    const result = await generate({
      packageType: submittedQuery,

      documentLabels: [
        ...new Set(
          documents.map(
            document => document.normalizedType || document.documentType,
          ),
        ),
      ],
    }).unwrap();

    setGenerated(result.package);

    setSelectedSlug(result.package.slug);
  };

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------

  if (!guestPreview && (packages.isLoading || documentsQuery.isLoading)) {
    return (
      <Screen>
        <LoadingState fill label="Loading packages…" />
      </Screen>
    );
  }

  // --------------------------------------------------------------------------
  // Error
  // --------------------------------------------------------------------------

  if (!guestPreview && (packages.error || documentsQuery.error)) {
    return (
      <Screen>
        <Stack
          gap="md"
          style={{
            padding: theme.spacing.lg,
          }}
        >
          <ErrorState
            message={errorMessage(packages.error ?? documentsQuery.error)}
          />

          <Button
            title="Retry"
            onPress={() => {
              packages.refetch();
              documentsQuery.refetch();
            }}
          />
        </Stack>
      </Screen>
    );
  }

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------

  return (
    <Screen
      scroll
      onRefresh={
        guestPreview
          ? undefined
          : () => Promise.all([packages.refetch(), documentsQuery.refetch()])
      }
      floatingAction={
        guestPreview || customPackVisible ? null : (
          <FloatingActionButton
            accessibilityLabel="Add package"
            onPress={() => setCustomPackVisible(true)}
          />
        )
      }
    >
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
        {/* ================================================================
            HEADER
        ================================================================ */}

        <Row align="center" justify="space-between" style={styles.header}>
          {/* Title */}

          <Row align="center" gap="sm">
            <AppText variant="title" style={styles.pageTitle}>
              Packages
            </AppText>

            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: theme.colors.surfaceElevated,

                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText
                variant="caption"
                color="secondary"
                style={styles.countText}
              >
                {items.length}
              </AppText>
            </View>
          </Row>

          {/* Header actions */}

          <Row gap="xs">
            {/* Search */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search"
              onPress={() => searchInputRef.current?.focus()}
              style={({ pressed }) => [
                styles.headerButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,

                  borderColor: theme.colors.border,

                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Search
                size={20}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            {/* Avatar */}

            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.surfaceElevated,

                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                style={[
                  styles.avatarText,
                  {
                    color: theme.colors.warning,
                  },
                ]}
              >
                A
              </AppText>
            </View>
          </Row>
        </Row>

        {/* ================================================================
            SEARCH
        ================================================================ */}

        <Row gap="xs" align="center">
          <View
            style={[
              styles.searchContainer,
              {
                flex: 1,

                backgroundColor: theme.colors.surface,

                borderColor: theme.colors.border,

                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Search
              size={19}
              color={theme.colors.textSecondary}
              strokeWidth={2}
            />

            <TextInput
              ref={searchInputRef}
              value={query}
              onChangeText={setQuery}
              maxLength={160}
              onSubmitEditing={search}
              returnKeyType="search"
              placeholder="Visa, loan, admission..."
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.searchInput,
                {
                  color: theme.colors.textPrimary,
                },
              ]}
            />
          </View>
        </Row>

        {/* ================================================================
            CATEGORIES
        ================================================================ */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <Row gap="xs">
            {categories.map(item => (
              <CategoryChip
                key={item}
                title={item}
                selected={category === item}
                onPress={() => {
                  setCategory(item);

                  setPage(1);

                  setGenerated(null);

                  setSelectedSlug(undefined);
                }}
              />
            ))}
          </Row>
        </ScrollView>

        {/* ================================================================
            SELECTED PACKAGE
        ================================================================ */}

        <Stack gap="sm">
          {/* EMPTY STATE */}

          {cards.length === 0 ? (
            <Stack gap="md">
              <EmptyState
                title={
                  guestPreview ? 'Readiness preview' : 'No matching packages'
                }
                message={
                  guestPreview
                    ? 'Your saved packages and document checklist will appear here when you sign in.'
                    : submittedQuery
                      ? `No package currently matches “${submittedQuery}”.`
                      : 'No packages are available in this category.'
                }
              />

              {guestPreview ? (
                <Button
                  title="Sign in"
                  onPress={() =>
                    navigation
                      .getParent<
                        NativeStackNavigationProp<RootStackParamList>
                      >()
                      ?.navigate('Auth')
                  }
                />
              ) : null}

              {!guestPreview && packages.data?.canGenerate && submittedQuery ? (
                <Button
                  title={
                    generation.isLoading
                      ? 'Searching official sources…'
                      : 'Search official sources'
                  }
                  disabled={generation.isLoading}
                  onPress={generateMissing}
                />
              ) : null}

              {!guestPreview && generation.error ? (
                <AppText color="danger">
                  {errorMessage(generation.error)}
                </AppText>
              ) : null}
            </Stack>
          ) : (
            cards.map(({ item, readiness }) => (
              <PackageCard
                key={item.slug}
                item={item}
                percentage={readiness.percentage}
                satisfiedRequired={readiness.satisfiedRequired}
                totalRequired={readiness.totalRequired}
                onPress={() => setSelectedSlug(item.slug)}
              />
            ))
          )}

          {/* LOAD MORE */}

          {!guestPreview && packages.data?.pagination.hasNextPage ? (
            <Button
              title="Load more"
              variant="secondary"
              onPress={() => setPage(value => value + 1)}
            />
          ) : null}
        </Stack>
        <PackageDetailBottomSheet
          visible={Boolean(selectedSlug)}
          selected={selected}
          readiness={selectedReadiness}
          documents={documents}
          loading={Boolean(selectedSlug && detail.isFetching && !detail.data)}
          error={detail.error}
          onAssignRequirement={(requirementId, documentId) =>
            selected
              ? assignRequirement({
                  slug: selected.slug,
                  requirementId,
                  documentId,
                  assignmentSource: 'USER_SELECTED',
                }).unwrap()
              : Promise.resolve()
          }
          onClearRequirement={requirementId =>
            selected
              ? clearRequirement({
                  slug: selected.slug,
                  requirementId,
                }).unwrap()
              : Promise.resolve()
          }
          onRefresh={() => {
            detail.refetch();
          }}
          onCheckSource={async () =>
            selected
              ? (await refreshPackage(selected.slug).unwrap()).message
              : undefined
          }
          onUpload={() => {
            setSelectedSlug(undefined);
            navigation.navigate('Documents');
          }}
          onClose={() => setSelectedSlug(undefined)}
        />
        <CustomPackBottomSheet
          visible={customPackVisible}
          onClose={() => setCustomPackVisible(false)}
          documentLabels={documents.map(
            document => document.normalizedType || document.documentType,
          )}
          onCreateGenerationJob={async (packageType, documentLabels) =>
            (
              await packagesApi.createCustomGenerationJob(
                packageType,
                documentLabels,
              )
            ).job
          }
          onGetGenerationJob={async jobId =>
            (await packagesApi.getCustomGenerationJob(jobId)).job
          }
          onSearchOrGenerate={(packageType, documentLabels) =>
            packagesApi.searchOrGenerate(packageType, documentLabels)
          }
          onSaveCustomPack={payload => createCustomPackage(payload).unwrap()}
          onPackSaved={pack => {
            setCreatedCustomPack(pack);
            setGenerated(null);
            setSelectedSlug(undefined);
            setCategory('Custom');
            setPage(1);
            setQuery('');
            setSubmittedQuery('');
          }}
        />
      </Stack>
    </Screen>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // --------------------------------------------------------------------------
  // Container
  // --------------------------------------------------------------------------

  container: {
    /*
     * Keep this screen compact.
     *
     * The previous implementation used -40 horizontal margin
     * to compensate for Screen padding. Keep the existing behavior
     * for now so the content remains aligned with the current design.
     */
    width: '100%',
    paddingHorizontal: 0,
  },

  // --------------------------------------------------------------------------
  // Header
  // --------------------------------------------------------------------------

  header: {
    minHeight: 44,
  },

  pageTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },

  countBadge: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  searchContainer: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    padding: 0,
  },

  // --------------------------------------------------------------------------
  // Categories
  // --------------------------------------------------------------------------

  categoryScroll: {
    paddingRight: 24,
    paddingVertical: 2,
  },

  categoryChip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // Package card
  // --------------------------------------------------------------------------

  packagePressable: {
    width: '100%',
  },

  packageCard: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // --------------------------------------------------------------------------
  // Readiness ring
  // --------------------------------------------------------------------------

  readinessRing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessValue: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessNumber: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // Package content
  // --------------------------------------------------------------------------

  packageContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
    marginRight: 6,
  },

  packageIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  packageTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },

  packageStatus: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },

  // --------------------------------------------------------------------------
  // Ready stamp
  // --------------------------------------------------------------------------

  readyStamp: {
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 8,
    transform: [
      {
        rotate: '-8deg',
      },
    ],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  readyText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0,
  },

  // --------------------------------------------------------------------------
  // Detail
  // --------------------------------------------------------------------------

  detailTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },

  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  detailSummary: {
    padding: 12,
  },

  detailPercentage: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '600',
  },

  requirementsHeading: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },

  requirementGroupHeading: {
    paddingTop: 4,
    paddingBottom: 2,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },

  requirementRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  requirementIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requirementContent: {
    flex: 1,
  },

  requirementTitle: {
    flex: 1,
    marginRight: 8,
  },
  documentChoice: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '90%',
    minHeight: '55%',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  sheetGrabber: {
    width: 40,
    height: 4,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#8A97AE',
  },
  sheetHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sheetPackageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  sheetContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetLoading: {
    minHeight: 180,
    justifyContent: 'center',
  },
  sheetError: {
    paddingVertical: 16,
  },
  sourceCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    gap: 8,
  },
  sourceText: {},
  checkedRow: {
    minHeight: 28,
  },
  packageHeaderCopy: { flex: 1, minWidth: 0, gap: 3 },
  packageSubtitle: { fontSize: 14, lineHeight: 20 },
  sourceProvider: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  sourceCheckedDate: { fontWeight: '600' },
  sourceLinks: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sourcesNote: { padding: 12 },
  readinessSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 8,
    marginBottom: 4,
  },
  readinessSummaryText: { fontSize: 16, lineHeight: 23 },
  missingRequirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  missingRequirementCopy: { flex: 1, minWidth: 0, gap: 2 },
  addRequirementButton: {
    minWidth: 56,
    minHeight: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadDocumentRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  downloadCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#B18AE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadDocumentCopy: { flex: 1, minWidth: 0, gap: 3 },
  downloadAction: {
    minHeight: 58,
    margin: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  downloadActionText: { color: '#17151D', fontSize: 16, fontWeight: '700' },
  actionPill: {
    alignSelf: 'flex-start',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 4,
  },
  readyStampLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 8,
    transform: [{ rotate: '-6deg' }],
  },
  readyTextLarge: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  vaultCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  vaultHeader: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  vaultTitle: {
    flex: 1,
  },
  vaultRow: {
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
  },
  vaultCheck: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultContent: {
    flex: 1,
    minWidth: 0,
  },
  sheetDisclaimer: {
    paddingHorizontal: 8,
    lineHeight: 18,
  },
});
