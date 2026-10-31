import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { Plus } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';

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
          backgroundColor: theme.colors.primary,
          bottom: theme.spacing.lg + tabInset,
          right: theme.spacing.lg,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Plus size={24} color={theme.colors.onPrimary} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
