import React from 'react';
import { TextInput } from '../primitives/TextInput';

export function PinInput({
  value,
  onChange,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <TextInput
      label="6-digit R-pin"
      value={value}
      onChangeText={text => onChange(text.replace(/\D/g, '').slice(0, 6))}
      keyboardType="number-pad"
      secureTextEntry
      maxLength={6}
      autoComplete="off"
      textContentType="none"
      autoFocus={autoFocus}
    />
  );
}
