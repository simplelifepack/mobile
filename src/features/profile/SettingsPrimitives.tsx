import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { ListGroup, ListRow } from '../../components/primitives/ListRow';

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

export function SettingsCard({ children }: React.PropsWithChildren) {
  return (
    <View style={styles.card}>
      <ListGroup>{children}</ListGroup>
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
  return (
    <ListRow
      icon={icon}
      title={title}
      subtitle={showSubtitle ? subtitle : undefined}
      danger={titleDanger}
      disabled={disabled}
      trailing={rightContent}
      onPress={onPress}
    />
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
  card: { width: '100%', marginBottom: 16 },
});
