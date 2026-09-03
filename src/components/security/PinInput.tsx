import React from 'react';
import styled from 'styled-components/native';
import { Row } from '../primitives/Row';
import { AppText } from '../primitives/AppText';
const Digit = styled.TextInput(({ theme }) => ({
  width: 44,
  height: 52,
  textAlign: 'center',
  color: theme.colors.textPrimary,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
  ...theme.typography.heading,
}));
export function PinInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Row gap="sm" align="center" justify="center">
      {Array.from({ length: 6 }, (_, index) => (
        <Digit
          key={index}
          accessibilityLabel={`PIN digit ${index + 1}`}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={1}
          value={value[index] ?? ''}
          onChangeText={digit => {
            const next = value.split('');
            next[index] = digit.replace(/\D/g, '');
            onChange(next.join('').slice(0, 6));
          }}
        />
      ))}
      <AppText style={{ position: 'absolute', opacity: 0 }}>
        Six digit PIN
      </AppText>
    </Row>
  );
}
