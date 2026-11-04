import React from 'react';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
const Scroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})(() => ({ flexGrow: 0 }));
const Items = styled.View(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing.sm,
}));
const Tab = styled.Pressable<{ $selected: boolean; $line: boolean }>(
  ({ theme, $selected, $line }) => ({
    minHeight: theme.sizes.minimumTouchTarget,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: $line ? 0 : theme.radius.pill,
    borderWidth: $line ? 0 : 1,
    borderBottomWidth: $line ? 1 : undefined,
    borderBottomColor: $selected ? theme.colors.primary : theme.colors.border,
    borderColor: $selected ? theme.colors.primary : theme.colors.border,
    backgroundColor: $line
      ? 'transparent'
      : $selected
        ? theme.colors.primarySoft
        : theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  }),
);
export function SectionTabs({
  value,
  options,
  onChange,
  label,
  disabled = false,
  variant = 'pill',
}: {
  value: string;
  options: Array<string | { label: string; value: string }>;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  variant?: 'pill' | 'line';
}) {
  return (
    <Scroll accessibilityRole="tablist" accessibilityLabel={label}>
      <Items>
        {options.map(option => {
          const item =
            typeof option === 'string'
              ? { label: option, value: option }
              : option;
          const selected = value === item.value;
          return (
            <Tab
              key={item.value}
              $selected={selected}
              $line={variant === 'line'}
              disabled={disabled}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled }}
              onPress={() => onChange(item.value)}
            >
              <AppText variant="label" color={selected ? 'accent' : 'muted'}>
                {item.label}
              </AppText>
            </Tab>
          );
        })}
      </Items>
    </Scroll>
  );
}
