import React from 'react';
import styled from 'styled-components/native';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';
import { Stack } from './Stack';
import { Row } from './Row';

const Trigger = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.input,
  padding: theme.spacing.md,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
}));
const Options = styled.ScrollView.attrs({
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
})(({ theme }) => ({
  maxHeight: theme.sizes.input * 4,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.md,
}));
const Option = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.input,
  padding: theme.spacing.md,
  justifyContent: 'center',
}));

export function InlineSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { theme } = useAppTheme();
  const selected = options.find(option => option.value === value);
  const expanded = open && !disabled;
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <Stack gap="xs">
      <AppText variant="label">{label}</AppText>
      <Trigger
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? 'Choose…' }}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={() => setOpen(current => !current)}
      >
        <Row align="center" justify="space-between">
          <AppText color={disabled ? 'muted' : 'primary'}>
            {selected?.label ?? 'Choose…'}
          </AppText>
          <Chevron
            size={theme.sizes.icon.sm}
            color={theme.colors.textSecondary}
          />
        </Row>
      </Trigger>
      {expanded ? (
        <Options accessibilityLabel={`${label} options`}>
          {options.map(option => (
            <Option
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: value === option.value }}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <Row align="center" justify="space-between">
                <AppText>{option.label}</AppText>
                {value === option.value ? (
                  <Check
                    size={theme.sizes.icon.sm}
                    color={theme.colors.textSecondary}
                  />
                ) : null}
              </Row>
            </Option>
          ))}
        </Options>
      ) : null}
    </Stack>
  );
}
