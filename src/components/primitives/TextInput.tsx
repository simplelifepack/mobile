import React from 'react';
import type { TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { AppText } from './AppText';
import { Stack } from './Stack';
const Field = styled.TextInput.attrs(({ theme }) => ({
  placeholderTextColor: theme.colors.textMuted,
  selectionColor: theme.colors.primary,
}))<{ $focused: boolean; $invalid: boolean }>(
  ({ theme, multiline, numberOfLines, $focused, $invalid }) => ({
    height: multiline
      ? numberOfLines
        ? theme.typography.body.lineHeight * numberOfLines +
          theme.spacing.md * 2
        : theme.sizes.input * 3
      : theme.sizes.input,
    textAlignVertical: multiline ? 'top' : 'center',
    paddingTop: multiline ? theme.spacing.sm : 0,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: $invalid
      ? theme.colors.danger
      : $focused
        ? theme.colors.primary
        : theme.colors.controlBorder,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    ...theme.typography.body,
    lineHeight: `${theme.typography.body.lineHeight}px`,
  }),
);
export function TextInput({
  label,
  error,
  onFocus,
  onBlur,
  validate,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  validate?: (value: string) => string;
}) {
  const [inlineError, setInlineError] = React.useState('');
  const message = error || inlineError;
  const [focused, setFocused] = React.useState(false);
  return (
    <Stack gap="xs">
      <AppText variant="label">{label}</AppText>
      <Field
        accessibilityLabel={label}
        $focused={focused}
        $invalid={Boolean(message)}
        accessibilityHint={message || undefined}
        onFocus={event => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          const value = String(props.value ?? '').trim();
          const problem =
            validate?.(value) ??
            (!value
              ? ''
              : props.keyboardType === 'email-address' &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                ? 'Enter a full email address, for example name@example.com.'
                : /6-digit|six-digit/i.test(label) && !/^\d{6}$/.test(value)
                  ? 'Enter exactly 6 digits.'
                  : /YYYY-MM-DD/.test(label) &&
                      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
                        Number.isNaN(Date.parse(value)) ||
                        new Date(value).toISOString().slice(0, 10) !== value)
                    ? 'Enter a real date in YYYY-MM-DD format.'
                    : props.keyboardType === 'decimal-pad' &&
                        !Number.isFinite(Number(value))
                      ? 'Enter a number without units or currency symbols.'
                      : '');
          setInlineError(problem);
          onBlur?.(event);
        }}
        {...props}
        onChangeText={value => {
          setInlineError('');
          props.onChangeText?.(value);
        }}
      />
      {message ? (
        <AppText variant="caption" color="danger">
          {message}
        </AppText>
      ) : null}
    </Stack>
  );
}
