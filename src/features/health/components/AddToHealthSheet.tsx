import React,{ useEffect,useState } from 'react';
import {
Modal,
Pressable,
ScrollView,
TextInput,
View
} from 'react-native';

import {
Bell,
Pill,
Plus,
Search,
Upload,
Users,
X,
} from 'lucide-react-native';


import {
healthApi,
type HealthAvailableMetric,
type TrackedHealthMetric
} from '../../../api/health.api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { LoadingState } from '../../../components/feedback/LoadingState';
import { AppText } from '../../../components/primitives/AppText';
import { Stack } from '../../../components/primitives/Stack';
import { ListGroup, ListRow, SelectionMark } from '../../../components/primitives/ListRow';
import { sizes } from '../../../design/tokens/sizes';
import { styles } from '../healthStyles';

export function AddToHealthSheet({
  memberName,
  onClose,
  onRecord,
  onReading,
  onReminder,
  onMedicine,
  onFamilyMember,
  visible = true,
  onDismiss,
}: {
  memberName: string;
  onClose: () => void;
  onRecord: () => void;
  onReading: () => void;
  onReminder: () => void;
  onMedicine: () => void;
  onFamilyMember: () => void;
  visible?: boolean;
  onDismiss?: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={[styles.addHealthOverlay, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>

        {/* Background / scrim */}
        <Pressable
          style={[styles.addHealthBackdrop, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />

        {/* Bottom sheet */}
        <View
          style={[
            styles.addHealthSheet,
            {
              paddingBottom: insets.bottom + 8,
              backgroundColor:
                theme.colors.surface.canvas,
              borderColor:
                theme.colors.border.default,
            },
          ]}
        >
          {/* Grabber */}

          <View
            style={[
              styles.addHealthGrabber,
              {
                backgroundColor:
                  theme.colors.surface.raised,
              },
            ]}
          />

          {/* Header */}

          <Stack gap="xs">
            <AppText
              variant="listTitle"
              style={styles.addHealthTitle}
            >
              Add to Health
            </AppText>

            <AppText
              variant="bodySm"
              color="secondary"
              style={styles.addHealthSubtitle}
            >
              For {memberName}
            </AppText>
          </Stack>

          <ScrollView style={styles.addHealthList} keyboardShouldPersistTaps="handled">
          <ListGroup>
          {/* A record */}

          <AddHealthRow
            icon={
              <Upload
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A record"
            description="Prescription, lab report, scan, or discharge summary"
            onPress={onRecord}
          />

          {/* A reading */}

          <AddHealthRow
            icon={
              <Plus
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A reading"
            description="Copy a value and its range from a report"
            onPress={onReading}
          />

          {/* A reminder */}

          <AddHealthRow
            icon={
              <Bell
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A reminder"
            description="Appointment, refill, or vaccination"
            onPress={onReminder}
          />

          {/* A medicine */}

          <AddHealthRow
            icon={
              <Pill
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A medicine"
            description="Name, dose, and how often"
            onPress={onMedicine}
          />

          {/* A family member */}

          <AddHealthRow
            icon={
              <Users
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A family member"
            description="Someone else whose records you keep"
            onPress={onFamilyMember}
          />
          </ListGroup>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function AddHealthRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return <ListRow compact icon={icon} title={title} subtitle={description} onPress={onPress} />;
}

export function MetricPickerModal({
  memberId,
  memberName,
  onClose,
  onChanged,
}: {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [available, setAvailable] = useState<HealthAvailableMetric[]>([]);
  const [tracked, setTracked] = useState<TrackedHealthMetric[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [initialKeys, setInitialKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(undefined);

      try {
        const [metrics, trackedMetrics] = await Promise.all([
          healthApi.availableMetrics(memberId, ''),
          healthApi.trackedMetrics(memberId),
        ]);

        if (!active) return;

        const keys = new Set(trackedMetrics.map(metric => metric.metricKey));

        setAvailable(metrics);
        setTracked(trackedMetrics);
        setSelectedKeys(keys);
        setInitialKeys(new Set(keys));
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load tests.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [memberId]);

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? available.filter(metric => metric.displayName.toLowerCase().includes(needle))
    : available;

  const toggleSelection = (metricKey: string) => {
    setSelectedKeys(current => {
      const next = new Set(current);
      if (next.has(metricKey)) {
        next.delete(metricKey);
      } else {
        next.add(metricKey);
      }
      return next;
    });
  };

  const resetSelection = () => {
    setSelectedKeys(new Set(initialKeys));
    setError(undefined);
  };

  const saveSelection = async () => {
    setSaving(true);
    setError(undefined);

    try {
      const trackedByKey = new Map(
        tracked.map(metric => [metric.metricKey, metric]),
      );

      const toRemove = tracked.filter(
        metric => !selectedKeys.has(metric.metricKey),
      );

      const toAdd = available.filter(
        metric =>
          selectedKeys.has(metric.metricKey) &&
          !trackedByKey.has(metric.metricKey),
      );

      for (const metric of toRemove) {
        await healthApi.untrackMetric(memberId, metric.id);
      }

      for (const metric of toAdd) {
        await healthApi.trackMetric(memberId, {
          metricKey: metric.metricKey,
          displayName: metric.displayName,
          context: metric.context,
          bodySite: metric.bodySite,
        });
      }

      await onChanged();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update charted tests.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => { if (!saving) onClose(); }}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <View
          style={[
            styles.metricPickerSheet,
            {
              backgroundColor: theme.colors.surface.canvas,
              borderColor: theme.colors.border.default,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View
            style={[
              styles.metricPickerGrabber,
              { backgroundColor: theme.colors.surface.raised },
            ]}
          />

          <View style={styles.metricPickerHeader}>
            <View style={styles.metricPickerText}>
              <AppText variant="heading">Choose tests</AppText>
              <AppText variant="bodySm" color="secondary">
                {available.filter(metric => selectedKeys.has(metric.metricKey)).length} of {available.length} selected
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close choose tests"
              disabled={saving} onPress={onClose} style={styles.metricPickerClose}>
              <X size={sizes.icon.md} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <AppText variant="bodySm" color="secondary" style={styles.metricPickerSubtitle}>
            Choose tests from {memberName}&apos;s reports to show on the overview.
          </AppText>

          <View style={[styles.metricPickerSearch, { backgroundColor: theme.colors.surface.inset, borderColor: theme.colors.border.default }]}>
            <Search size={sizes.icon.sm} color={theme.colors.icon.secondary} />
            <TextInput
              accessibilityLabel="Search tests"
              value={query}
              onChangeText={setQuery}
              placeholder="Search tests"
              placeholderTextColor={theme.colors.text.tertiary}
              autoCorrect={false}
              returnKeyType="search"
              style={[styles.metricPickerSearchInput, { color: theme.colors.text.primary }]}
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}>
                <X size={sizes.icon.sm} color={theme.colors.icon.secondary} />
              </Pressable>
            ) : null}
          </View>

          {loading ? (
            <LoadingState label="Loading tests…" size={28} />
          ) : null}

          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}

          <ScrollView
            style={styles.metricPickerList}
            contentContainerStyle={styles.metricPickerListContent}
            showsVerticalScrollIndicator
          >
            {!loading && !error && available.length === 0 ? (
              <AppText color="secondary">
                No tests found in this profile.
              </AppText>
            ) : null}

            {!loading && !error && available.length > 0 && shown.length === 0 ? (
              <AppText color="secondary">No tests match &ldquo;{query.trim()}&rdquo;.</AppText>
            ) : null}

            {shown.map(metric => {
              const isSelected = selectedKeys.has(metric.metricKey);

              return (
                <Pressable
                  key={metric.metricKey}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  disabled={saving}
                  onPress={() => toggleSelection(metric.metricKey)}
                  style={[
                    styles.metricPickerRow,
                    { borderBottomColor: theme.colors.border.default },
                  ]}
                >
                  <SelectionMark checked={isSelected} />

                  <View style={styles.metricPickerText}>
                    <AppText variant="label">
                      {metric.displayName}
                    </AppText>

                    <AppText
                      variant="bodySm"
                      color="secondary"
                    >
                      {metric.historicalReadingCount}{' '}
                      {metric.historicalReadingCount === 1
                        ? 'reading'
                        : 'readings'}
                    </AppText>
                  </View>
                  <AppText variant="label" style={styles.metricPickerValue}>
                    {metric.latestValue ?? '—'}{metric.secondaryValue != null ? `/${metric.secondaryValue}` : ''}{metric.unit ? ` ${metric.unit}` : ''}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.metricPickerFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={saving || loading}
              onPress={resetSelection}
              style={[
                styles.metricPickerButton,
                styles.metricPickerResetButton,
                {
                  borderColor: theme.colors.border.default,
                  opacity: saving || loading ? 0.6 : 1,
                },
              ]}
            >
              <AppText variant="label">Reset</AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={saving || loading}
              onPress={() => {
                void saveSelection();
              }}
              style={[
                styles.metricPickerButton,
                styles.metricPickerDoneButton,
                {
                  backgroundColor: theme.colors.action.primary.default,
                  opacity: saving || loading ? 0.6 : 1,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{ color: theme.colors.text.onBrand }}
              >
                {saving ? 'Saving…' : 'Done'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
