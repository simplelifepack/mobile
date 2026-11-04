import styled from 'styled-components/native';
import { Check, Plus } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { EmptyState } from '../../components/feedback/EmptyState';
import React from 'react';
import { healthApi } from '../../api/health.api';
import { DetailSheet } from '../shared/DetailSheet';
import {
  AppText,
  Button,
  ResourceStatus,
  useAction,
  useResource,
} from '../shared/FeatureUI';
import { metricIdentity } from './healthMetrics';

const TestRow = styled.Pressable<{ $selected: boolean }>(
  ({ theme, $selected }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    minHeight: theme.sizes.minimumTouchTarget,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: $selected ? theme.colors.primary : theme.colors.border,
    backgroundColor: $selected
      ? theme.colors.primarySoft
      : theme.colors.surface,
  }),
);
const TestName = styled(AppText)({ flex: 1 });
export function HealthMetricChooser({
  memberId,
  onClose,
  onChanged,
}: {
  memberId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { theme } = useAppTheme();
  const resource = useResource(async () => {
    const [available, tracked] = await Promise.all([
      healthApi.availableMetrics(memberId),
      healthApi.trackedMetrics(memberId),
    ]);
    return { available, tracked };
  }, [memberId]);
  const tracked = resource.data?.tracked ?? [];
  const initialized = React.useRef(false);
  const [selected, setSelected] = React.useState(() =>
    tracked.map(metricIdentity),
  );
  const applied = React.useRef(
    new Map(tracked.map(metric => [metricIdentity(metric), metric])),
  );
  React.useEffect(() => {
    if (!resource.data || initialized.current) return;
    initialized.current = true;
    setSelected(resource.data.tracked.map(metricIdentity));
    applied.current = new Map(
      resource.data.tracked.map(metric => [metricIdentity(metric), metric]),
    );
  }, [resource.data]);
  const action = useAction();
  const options = [
    ...new Map(
      [...tracked, ...(resource.data?.available ?? [])].map(item => [
        metricIdentity(item),
        item,
      ]),
    ).values(),
  ];
  return (
    <DetailSheet
      title="Choose tracked tests"
      onClose={onClose}
      busy={action.busy}
      footer={
        <Button
          title="Apply selected tests"
          disabled={action.busy || resource.loading || Boolean(resource.error)}
          onPress={() => {
            void action.run(async () => {
              try {
                for (const item of options) {
                  const key = metricIdentity(item);
                  if (selected.includes(key) && !applied.current.has(key))
                    applied.current.set(
                      key,
                      await healthApi.trackMetric(memberId, item),
                    );
                  else if (
                    !selected.includes(key) &&
                    applied.current.has(key)
                  ) {
                    await healthApi.untrackMetric(
                      memberId,
                      applied.current.get(key)!.id,
                    );
                    applied.current.delete(key);
                  }
                }
                onClose();
              } finally {
                onChanged();
              }
            }, '');
          }}
        />
      }
    >
      <ResourceStatus resource={resource} />
      <AppText variant="caption" color="muted">
        {selected.length} selected
      </AppText>
      {!resource.loading && !resource.error && !options.length ? (
        <EmptyState
          title="No tests yet"
          message="Add a reading or health report to start tracking tests."
          illustration="health"
          actionLabel="Go back"
          onAction={onClose}
        />
      ) : null}
      {options.map(item => (
        <TestRow
          key={metricIdentity(item)}
          $selected={selected.includes(metricIdentity(item))}
          accessibilityRole="checkbox"
          accessibilityLabel={item.displayName}
          accessibilityState={{
            checked: selected.includes(metricIdentity(item)),
          }}
          disabled={action.busy || resource.loading || Boolean(resource.error)}
          onPress={() =>
            setSelected(keys =>
              keys.includes(metricIdentity(item))
                ? keys.filter(key => key !== metricIdentity(item))
                : [...keys, metricIdentity(item)],
            )
          }
        >
          <TestName variant="label">{item.displayName}</TestName>
          {selected.includes(metricIdentity(item)) ? (
            <Check size={20} color={theme.colors.primary} />
          ) : (
            <Plus size={20} color={theme.colors.textMuted} />
          )}
        </TestRow>
      ))}
      {action.message ? (
        <AppText color="danger" variant="caption" accessibilityRole="alert">
          Couldn’t update your tests. Your selection is kept. Try again.
        </AppText>
      ) : null}
    </DetailSheet>
  );
}
