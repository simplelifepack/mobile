import React from 'react';
import type { TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { AppText } from './AppText';
import { Stack } from './Stack';
const Field = styled.TextInput(({ theme }) => ({
  height: theme.sizes.input,
  color: theme.colors.text.primary,
  backgroundColor: theme.colors.surface.default,
  borderWidth: 1,
  borderColor: theme.colors.border.default,
  borderRadius: theme.radius.control,
  paddingHorizontal: theme.spacing.md,
  ...theme.typography.body,
}));
export function TextInput({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <Stack gap="xs">
      <AppText variant="eyebrow">{label}</AppText>
      <Field {...props} />
      {error ? (
        <AppText variant="bodySm" color="danger">
          {error}
        </AppText>
      ) : null}
    </Stack>
  );
}
