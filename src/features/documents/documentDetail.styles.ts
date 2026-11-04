import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/primitives/AppText';
export const Surface = styled(SafeAreaView).attrs({
  edges: ['top', 'bottom'] as const,
})(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.background }));
export const Header = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing.md,
  gap: theme.spacing.md,
  borderBottomWidth: 1,
  borderColor: theme.colors.border,
}));
export const IconTile = styled.View(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const Copy = styled.View({ flex: 1, gap: 4 });
export const IconButton = styled.Pressable(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.surfaceElevated,
  justifyContent: 'center',
  alignItems: 'center',
}));
export const Scroller = styled.ScrollView({ flex: 1 });
export const Body = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  gap: theme.spacing.lg,
}));
export const Section = styled.View(({ theme }) => ({ gap: theme.spacing.sm }));
export const Facts = styled.View({});
export const Fact = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  borderTopWidth: 1,
  borderColor: theme.colors.border,
  minHeight: 36,
}));
export const Value = styled(AppText).attrs({ align: 'right' as const })({
  flex: 1,
});
export const Control = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  paddingHorizontal: theme.spacing.md,
  minHeight: 44,
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.surfaceElevated,
}));
export const PackageRow = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  borderTopWidth: 1,
  borderColor: theme.colors.border,
  paddingVertical: theme.spacing.sm,
  minHeight: 44,
}));
export const Pill = styled.View(({ theme }) => ({
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
  borderRadius: theme.radius.pill,
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  backgroundColor: theme.colors.surfaceElevated,
}));
export const Footer = styled.View(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing.sm,
  padding: theme.spacing.md,
  borderTopWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.background,
}));
export const Preview = styled.Pressable<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 48,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    opacity: disabled ? 0.5 : 1,
  }),
);
export const Delete = styled(IconButton)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: 'transparent',
    opacity: disabled ? 0.5 : 1,
  }),
);
export const More = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 44,
  borderTopWidth: 1,
  borderColor: theme.colors.border,
}));
