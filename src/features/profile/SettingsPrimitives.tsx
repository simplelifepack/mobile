import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

export function SectionTitle({
  title,
  danger = false,
}: {
  title: string;
  danger?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <AppText
      style={[
        styles.sectionTitle,
        {
          color: danger
            ? theme.colors.status.danger.text
            : theme.colors.text.secondary,
        },
      ]}
    >
      {title}
    </AppText>
  );
}

export function SettingsCard({
  children,
}: React.PropsWithChildren) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface.default,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  titleDanger = false,
  showSubtitle = true,
  rightContent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  titleDanger?: boolean;
  showSubtitle?: boolean;
  rightContent?: React.ReactNode;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.settingsRow, { opacity: disabled ? 0.55 : 1 }]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: theme.colors.surface.raised },
        ]}
      >
        {icon}
      </View>

      <View style={styles.settingsRowContent}>
        <AppText
          style={[
            styles.rowTitle,
            titleDanger && { color: theme.colors.status.danger.text },
          ]}
        >
          {title}
        </AppText>

        {showSubtitle && subtitle ? (
          <AppText
            style={styles.rowSubtitle}
            color="secondary"
            numberOfLines={3}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {rightContent ?? (
        <ChevronRight
          size={21}
          color={theme.colors.text.secondary}
          strokeWidth={2}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: '700',
    letterSpacing: 0,
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 6,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.surface,
    overflow: 'hidden',
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsRowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    marginTop: 4,
  },
});