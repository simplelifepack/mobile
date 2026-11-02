import React from 'react';
import type { TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { Search } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Row } from './Row';
const Field = styled.TextInput(({ theme }) => ({
  flex: 1,
  color: theme.colors.text.primary,
  ...theme.typography.body,
}));
const Container = styled.View(({ theme }) => ({
  height: theme.sizes.input,
  paddingHorizontal: theme.spacing.md,
  borderRadius: theme.radius.control,
  backgroundColor: theme.colors.surface.default,
  borderWidth: 1,
  borderColor: theme.colors.border.default,
  justifyContent: 'center',
}));
export function SearchBar(props: TextInputProps) {
  const { theme } = useAppTheme();
  return (
    <Container>
      <Row align="center" gap="sm">
        <Search size={theme.sizes.icon.sm} color={theme.colors.text.tertiary} />
        <Field
          placeholder="Search"
          placeholderTextColor={theme.colors.text.tertiary}
          {...props}
        />
      </Row>
    </Container>
  );
}
