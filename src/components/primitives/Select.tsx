import React from 'react';
import styled from 'styled-components/native';
import { ChevronDown } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';
import { Row } from './Row';
const Container = styled.Pressable(({ theme }) => ({
  height: theme.sizes.input,
  paddingHorizontal: theme.spacing.md,
  justifyContent: 'center',
  backgroundColor: theme.colors.surface.default,
  borderWidth: 1,
  borderColor: theme.colors.border.default,
  borderRadius: theme.radius.control,
}));
export function Select({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Container
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Row align="center" justify="space-between">
        <AppText>{value}</AppText>
        <ChevronDown
          size={theme.sizes.icon.sm}
          color={theme.colors.text.secondary}
        />
      </Row>
    </Container>
  );
}
