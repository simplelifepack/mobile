import React from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../primitives/AppText';
import { Row } from '../primitives/Row';
export function AppHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Row align="center" gap="sm">
      {onBack ? (
        <ChevronLeft
          accessibilityLabel="Back"
          onPress={onBack}
          color={theme.colors.textPrimary}
          size={theme.sizes.icon.lg}
        />
      ) : null}
      <AppText variant="heading">{title}</AppText>
    </Row>
  );
}
