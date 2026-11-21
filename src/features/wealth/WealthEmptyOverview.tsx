import React from 'react';
import {
  ChevronRight,
  Landmark,
  Shield,
  IndianRupee,
  Siren,
  Users,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { space, spacing } from '../../design/tokens/spacing';
import { fontSize, fontWeights, lineHeight } from '../../design/tokens/typography';

const categories = [
  {
    title: 'Accounts and investments',
    subtitle: 'No entries added',
    Icon: Landmark,
  },
  { title: 'Insurance', subtitle: 'No policies added', Icon: Shield },
  { title: 'Loans', subtitle: 'No loans added', Icon: IndianRupee },
  {
    title: 'Lent and borrowed',
    subtitle: 'No transactions added',
    Icon: Users,
  },
] as const;

export function WealthEmptyOverview({
  onOpenCategory,
}: {
  onOpenCategory: (category: (typeof categories)[number]['title']) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.content}>
      <View
        style={[
          styles.intro,
          { backgroundColor: theme.colors.surface.brandTint },
        ]}
      >
        <AppText
          variant="compactLabel"
          style={{ color: theme.colors.text.interactive }}
        >
          Your family’s starting point
        </AppText>
        <AppText
          variant="caption"
          style={{ color: theme.colors.text.primary }}
        >
          Add your first holding to see a family access readiness overview.
        </AppText>
      </View>
      <View style={styles.heading}>
        <AppText variant="heading" style={styles.title}>
          No holdings yet
        </AppText>
        <AppText variant="bodySm" color="secondary">
          Record what you own, what you owe and how your family can access the
          details.
        </AppText>
      </View>
      <View style={styles.categories}>
        {categories.map(({ title, subtitle, Icon }) => (
          <Pressable
            key={title}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={() => onOpenCategory(title)}
            style={({ pressed }) => [
              styles.category,
              {
                backgroundColor: theme.colors.surface.default,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Icon
              size={sizes.icon.md}
              color={theme.colors.icon.interactive}
              strokeWidth={1.8}
            />
            <View style={styles.categoryCopy}>
              <AppText variant="compactLabel" style={styles.categoryTitle}>
                {title}
              </AppText>
              <AppText variant="caption" color="secondary" style={styles.subtitle}>
                {subtitle}
              </AppText>
            </View>
            <ChevronRight
              size={sizes.icon.md}
              color={theme.colors.icon.interactive}
            />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="SOS handoff"
        accessibilityState={{ disabled: true }}
        accessibilityHint="Add your first Wealth entry to enable SOS handoff."
        disabled
        style={[
          styles.category,
          styles.disabledHandoff,
          { backgroundColor: theme.colors.surface.default },
        ]}
      >
        <Siren
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
          strokeWidth={1.8}
        />
        <View style={styles.categoryCopy}>
          <AppText variant="compactLabel" style={styles.categoryTitle}>
            SOS handoff
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.subtitle}>
            Available after your first entry
          </AppText>
        </View>
        <ChevronRight
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
        />
      </Pressable>
      <AppText variant="caption" color="muted" style={styles.handoffNote}>
        SOS handoff becomes available after your first entry. You can add
        trusted people now.
      </AppText>
    </View>
  );
}

export function WealthEmptyOverviewActions({
  guestPreview,
  onAddFirstEntry,
  onManageTrustedPeople,
}: {
  guestPreview: boolean;
  onAddFirstEntry: () => void;
  onManageTrustedPeople: () => void;
}) {
  const tabBarHeight = React.useContext(BottomTabBarHeightContext) ?? 0;

  return (
    <View style={[styles.actions, { bottom: tabBarHeight + space[12] }]}>
      <Button
        title={guestPreview ? 'Sign in to continue' : 'Add your first entry'}
        onPress={onAddFirstEntry}
      />
      <Button
        title="Manage trusted people"
        variant="secondary"
        onPress={onManageTrustedPeople}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  intro: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
  },
  heading: { gap: space[4] },
  title: {
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: fontWeights.bold,
  },
  category: {
    minHeight: 60,
    paddingHorizontal: space[12],
    paddingVertical: space[12],
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  disabledHandoff: { opacity: 0.55 },
  categories: { gap: spacing.sm },
  categoryCopy: { flex: 1, gap: space[2] },
  categoryTitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: fontWeights.semibold,
  },
  subtitle: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  handoffNote: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: spacing.sm,
    paddingHorizontal: space[20],
    paddingBottom: space[12],
    paddingTop: space[8],
  },
});
