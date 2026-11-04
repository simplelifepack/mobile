import React from 'react';
import type { TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { Search } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Row } from './Row';
const Field = styled.TextInput(({ theme }) => ({
  flex: 1,
  color: theme.colors.textPrimary,
  ...theme.typography.body,
  lineHeight: `${theme.typography.body.lineHeight}px`,
}));
const Container = styled.View(({ theme }) => ({
  height: theme.sizes.input,
  paddingHorizontal: theme.spacing.md,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  justifyContent: 'center',
}));
export function SearchBar(props: TextInputProps) {
  const { theme } = useAppTheme();
  return (
    <Container>
      <Row align="center" gap="sm">
        <Search size={theme.sizes.icon.sm} color={theme.colors.textMuted} />
        <Field
          placeholder="Search"
          placeholderTextColor={theme.colors.textMuted}
          {...props}
        />
      </Row>
    </Container>
  );
}
