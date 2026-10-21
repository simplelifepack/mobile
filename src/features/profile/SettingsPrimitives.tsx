import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';

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
            ? theme.colors.danger
            : theme.colors.textSecondary,
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
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
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
          { backgroundColor: theme.colors.surfaceElevated },
        ]}
      >
        {icon}
      </View>

      <View style={styles.settingsRowContent}>
        <AppText
          style={[
            styles.rowTitle,
            titleDanger && { color: theme.colors.danger },
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
          color={theme.colors.textSecondary}
          strokeWidth={2}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0,
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 6,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
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
    borderRadius: 12,
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
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});