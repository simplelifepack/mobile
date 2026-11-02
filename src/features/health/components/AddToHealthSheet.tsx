import React,{ useEffect,useState } from 'react';
import {
Modal,
Pressable,
ScrollView,
View
} from 'react-native';

import {
Bell,
ChevronRight,
Pill,
Plus,
Upload,
Users
} from 'lucide-react-native';


import {
healthApi,
type HealthAvailableMetric,
type TrackedHealthMetric
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { LoadingState } from '../../../components/feedback/LoadingState';
import { AppText } from '../../../components/primitives/AppText';
import { Stack } from '../../../components/primitives/Stack';
import { styles } from '../healthStyles';

export function AddToHealthSheet({
  memberName,
  onClose,
  onRecord,
  onReading,
  onReminder,
  onMedicine,
  onFamilyMember,
}: {
  memberName: string;
  onClose: () => void;
  onRecord: () => void;
  onReading: () => void;
  onReminder: () => void;
  onMedicine: () => void;
  onFamilyMember: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.addHealthOverlay}>

        {/* Background / scrim */}
        <Pressable
          style={styles.addHealthBackdrop}
          onPress={onClose}
        />

        {/* Bottom sheet */}
        <View
          style={[
            styles.addHealthSheet,
            {
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
              variant="heading"
              style={styles.addHealthTitle}
            >
              Add to Health
            </AppText>

            <AppText
              variant="body"
              color="secondary"
              style={styles.addHealthSubtitle}
            >
              For {memberName}
            </AppText>
          </Stack>

          <View
            style={[
              styles.addHealthDivider,
              {
                backgroundColor:
                  theme.colors.border.default,
              },
            ]}
          />

          {/* A record */}

          <AddHealthRow
            icon={
              <Upload
                size={24}
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
                size={25}
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
                size={24}
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
                size={24}
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
                size={25}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />
            }
            title="A family member"
            description="Someone else whose records you keep"
            onPress={onFamilyMember}
            last
          />
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
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.addHealthRow,
        {
          borderBottomColor:
            theme.colors.border.default,
          borderBottomWidth: last ? 0 : 1,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={styles.addHealthIcon}>
        {icon}
      </View>

      <View style={styles.addHealthRowContent}>
        <AppText
          variant="body"
          style={styles.addHealthRowTitle}
        >
          {title}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
          numberOfLines={2}
          style={styles.addHealthRowDescription}
        >
          {description}
        </AppText>
      </View>

      <ChevronRight
        size={22}
        color={theme.colors.text.tertiary}
        strokeWidth={2}
      />
    </Pressable>
  );
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

  const [available, setAvailable] = useState<HealthAvailableMetric[]>([]);
  const [tracked, setTracked] = useState<TrackedHealthMetric[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [initialKeys, setInitialKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

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
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.metricPickerSheet,
            {
              backgroundColor: theme.colors.surface.canvas,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <View
            style={[
              styles.metricPickerGrabber,
              { backgroundColor: theme.colors.surface.raised },
            ]}
          />

          <AppText variant="heading" style={styles.metricPickerTitle}>
            Which tests to chart
          </AppText>

          <AppText
            variant="body"
            color="secondary"
            style={styles.metricPickerSubtitle}
          >
            Every test read from {memberName}&apos;s reports. Nothing is
            hidden, only unpinned from this screen.
          </AppText>

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
            {!loading && available.length === 0 ? (
              <AppText color="secondary">
                No tests found in this profile.
              </AppText>
            ) : null}

            {available.map(metric => {
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
                  <View
                    style={[
                      styles.metricPickerCircle,
                      {
                        borderColor: isSelected
                          ? theme.colors.border.interactive
                          : theme.colors.border.default,
                        backgroundColor: isSelected
                          ? theme.colors.action.primary.default
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected ? (
                      <View style={[styles.metricPickerCircleInner, { backgroundColor: theme.colors.text.onBrand }]} />
                    ) : null}
                  </View>

                  <View style={styles.metricPickerText}>
                    <AppText
                      variant="label"
                      style={styles.metricPickerMetricName}
                    >
                      {metric.displayName}
                    </AppText>

                    <AppText
                      variant="body"
                      color="secondary"
                      style={styles.metricPickerMetricDetail}
                    >
                      {metric.historicalReadingCount}{' '}
                      {metric.historicalReadingCount === 1
                        ? 'reading'
                        : 'readings'}
                      {' · latest '}
                      {metric.latestValue ?? '—'}
                      {metric.unit ? ` ${metric.unit}` : ''}
                    </AppText>
                  </View>
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
