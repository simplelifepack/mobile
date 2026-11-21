import React from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { WealthRecord } from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { recordReadinessGaps } from './wealthReadiness';

type Props = {
  visible: boolean;
  records: WealthRecord[];
  userName?: string;
  onClose: () => void;
  onEdit: (record: WealthRecord) => void;
  onAddDocument: (record: WealthRecord) => void;
};

function missingSummary(record: WealthRecord) {
  const gaps = recordReadinessGaps(record);
  const labels = gaps.map(gap => {
    switch (gap) {
      case 'No document':
        return 'document';
      case 'No access note':
        return 'family access note';
      case 'No nominee':
        return 'nominee information';
      case 'Owner or reference missing':
        return 'owner or reference';
      case 'Value or amount missing':
        return 'value or amount';
      default:
        return gap.toLowerCase();
    }
  });
  return {
    labels,
    count: labels.length,
    summary: labels.length
      ? `Missing ${labels.join(' + ')}`
      : 'All details added',
  };
}

export function MissingDetailsScreen({
  visible,
  records,
  userName,
  onClose,
  onEdit,
  onAddDocument,
}: Props) {
  const { theme } = useAppTheme();
  const needsDocument = records.find(record =>
    recordReadinessGaps(record).includes('No document'),
  );
  const firstRecord = records[0];
  const addTitle = needsDocument
    ? `Add ${needsDocument.title} document`
    : firstRecord
      ? `Update ${firstRecord.title} details`
      : 'Back to overview';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <Screen scroll padded={false} contentContainerStyle={styles.content}>
          <Row align="center" gap="sm" style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Wealth"
              hitSlop={8}
              onPress={onClose}
              style={styles.back}
            >
              <ChevronLeft
                size={sizes.icon.md}
                color={theme.colors.icon.interactive}
              />
            </Pressable>
            <AppText variant="overviewTitle">Missing details</AppText>
          </Row>

          <Row
            align="center"
            justify="space-between"
            style={styles.familyContext}
          >
            <AppText variant="caption" color="interactive">
              {userName ? `${userName} · You` : 'You'}
            </AppText>
            <AppText variant="caption" color="secondary">
              Family wealth register
            </AppText>
          </Row>

          <Stack gap="sm">
            <AppText variant="heading">
              Make {records.length} more{' '}
              {records.length === 1 ? 'holding' : 'holdings'} family-ready
            </AppText>
            <AppText variant="bodySm" color="secondary">
              Complete the missing items below. Your score updates when every
              required detail is saved.
            </AppText>
          </Stack>

          <Stack gap="sm">
            {records.map(record => {
              const { summary, count } = missingSummary(record);
              return (
                <Pressable
                  key={record.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${record.title}, ${summary}, ${count} ${count === 1 ? 'item' : 'items'}`}
                  onPress={() => onEdit(record)}
                  style={({ pressed }) => [
                    styles.recordCard,
                    { backgroundColor: theme.colors.surface.raised },
                    pressed && styles.pressed,
                  ]}
                >
                  <AlertCircle
                    size={sizes.icon.md}
                    color={theme.colors.status.warning.icon}
                    strokeWidth={2}
                  />
                  <View style={styles.recordCopy}>
                    <AppText variant="label">{record.title}</AppText>
                    <AppText
                      variant="bodySm"
                      color="secondary"
                      numberOfLines={2}
                    >
                      {summary}
                    </AppText>
                  </View>
                  <AppText variant="label" color="interactive">
                    {count} {count === 1 ? 'item' : 'items'}
                  </AppText>
                  <ChevronRight
                    size={sizes.icon.md}
                    color={theme.colors.icon.interactive}
                  />
                </Pressable>
              );
            })}
          </Stack>

          <Card
            style={[
              styles.tip,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              Start with access instructions
            </AppText>
            <AppText variant="bodySm">
              A short note can tell your family which branch, advisor or support
              team to contact. Never add passwords, PINs or OTPs.
            </AppText>
          </Card>
          <Button
            title={addTitle}
            onPress={() => {
              if (needsDocument) onAddDocument(needsDocument);
              else if (firstRecord) onEdit(firstRecord);
              else onClose();
            }}
          />
          <Button
            title="Back to overview"
            variant="secondary"
            onPress={onClose}
          />
        </Screen>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: sizes.minimumTouchTarget },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: { minHeight: sizes.minimumTouchTarget },
  content: { padding: layout.gutter, gap: spacing.md },
  recordCard: {
    minHeight: 60,
    padding: space[12],
    borderRadius: radius.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordCopy: { flex: 1, gap: space[4] },
  tip: { padding: space[12], borderRadius: radius.tile, gap: space[4] },
  pressed: { opacity: 0.8 },
});
