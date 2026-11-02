import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Plus } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { sizes } from '../../design/tokens/sizes';
import { shadows } from '../../design/tokens/shadows';
import { radius } from '../../design/tokens/radius';

export function FloatingActionButton({
  accessibilityLabel,
  onPress,
}: {
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const tabInset = React.useContext(BottomTabBarHeightContext) ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.action.primary.default,
          bottom: theme.spacing.lg + tabInset,
          right: theme.spacing.lg,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Plus size={24} color={theme.colors.text.onBrand} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: sizes.fab,
    height: sizes.fab,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
});
