import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BadgeInfo,
  FileText,
  Landmark,
  NotebookText,
  UserRound,
  Wallet,
} from 'lucide-react-native';
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
import { wealthReadiness } from './wealthReadiness';

type Props = {
  visible: boolean;
  records: WealthRecord[];
  userName?: string;
  onClose: () => void;
  onReviewIncomplete: () => void;
};

const criteria = [
  {
    title: 'Owner and reference',
    description: 'Who owns it and how to identify it.',
    Icon: UserRound,
  },
  {
    title: 'Value or amount',
    description: 'A balance, cover, outstanding loan or transaction amount.',
    Icon: Wallet,
  },
  {
    title: 'Nominee, if applicable',
    description:
      'Name and relationship for accounts, investments and insurance.',
    Icon: Landmark,
  },
  {
    title: 'Supporting document',
    description: 'A statement, policy, agreement or payment receipt.',
    Icon: FileText,
  },
  {
    title: 'Family access note',
    description: 'Where to go, whom to contact and the next steps.',
    Icon: NotebookText,
  },
];

export function ReadinessExplainer({
  visible,
  records,
  userName,
  onClose,
  onReviewIncomplete,
}: Props) {
  const { theme } = useAppTheme();
  const readiness = wealthReadiness(records);

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
              <ArrowLeft
                size={sizes.icon.md}
                color={theme.colors.icon.interactive}
              />
            </Pressable>
            <AppText variant="overviewTitle">What counts</AppText>
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

          <Card
            style={[
              styles.scoreCard,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              {readiness.percentage}% family-ready
            </AppText>
            <AppText variant="bodySm">
              {readiness.complete.length} complete holdings ÷{' '}
              {readiness.holdings.length} recorded holdings × 100.
            </AppText>
          </Card>

          <AppText variant="heading">When is a holding ready?</AppText>

          <Stack gap="sm">
            {criteria.map(({ title, description, Icon }) => (
              <Row
                key={title}
                align="center"
                gap="sm"
                style={[
                  styles.criterion,
                  { backgroundColor: theme.colors.surface.raised },
                ]}
              >
                <Icon
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                  strokeWidth={2}
                />
                <View style={styles.criterionCopy}>
                  <AppText variant="label">{title}</AppText>
                  <AppText variant="bodySm" color="secondary">
                    {description}
                  </AppText>
                </View>
              </Row>
            ))}
          </Stack>

          <Card
            style={[
              styles.scoreCard,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <Row align="center" gap="sm">
              <BadgeInfo
                size={sizes.icon.md}
                color={theme.colors.icon.interactive}
              />
              <AppText variant="label" color="interactive">
                Not a financial health score
              </AppText>
            </Row>
            <AppText variant="bodySm">
              It measures recorded access information, not your wealth or
              financial health.
            </AppText>
          </Card>

          <AppText variant="bodySm" color="secondary">
            Assets you add are included. Settled informal transactions are
            excluded.
          </AppText>
          <Button
            title={`Review ${readiness.incomplete.length} incomplete holdings`}
            onPress={onReviewIncomplete}
            disabled={!readiness.incomplete.length}
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
  scoreCard: { padding: space[12], gap: space[4], borderRadius: radius.tile },
  criterion: {
    minHeight: 60,
    padding: space[12],
    borderRadius: radius.tile,
    alignItems: 'center',
  },
  criterionCopy: { flex: 1, gap: space[4] },
});
