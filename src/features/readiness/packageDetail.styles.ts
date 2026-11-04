import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/primitives/AppText';
export const Surface = styled(SafeAreaView).attrs({
  edges: ['top', 'bottom'] as const,
})(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.background }));
export const Scroller = styled.ScrollView.attrs({
  contentInsetAdjustmentBehavior: 'automatic' as const,
})({ flex: 1 });
export const Header = styled.View(({ theme }) => ({
  padding: theme.spacing.lg,
  gap: theme.spacing.md,
  backgroundColor: theme.colors.surface,
  borderBottomWidth: 1,
  borderColor: theme.colors.border,
}));
export const Line = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.md,
}));
export const Copy = styled.View({ flex: 1, gap: 4 });
export const IconTile = styled.View(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const IconAction = styled.Pressable(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.surfaceElevated,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const SourceCard = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  paddingRight: theme.spacing.md + 44,
  borderRadius: theme.radius.lg,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surfaceElevated,
  gap: theme.spacing.sm,
}));
export const Refresh = styled(IconAction)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing.sm,
  top: '50%',
  transform: 'translateY(-22px)',
  backgroundColor: 'transparent',
}));
export const Body = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  gap: theme.spacing.md,
}));
export const Panel = styled.View(({ theme }) => ({
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.colors.surface,
  overflow: 'hidden',
}));
export const PanelHeader = styled(Line)(({ theme }) => ({
  padding: theme.spacing.md,
}));
export const Item = styled.View(({ theme }) => ({
  borderTopWidth: 1,
  borderColor: theme.colors.border,
}));
export const RequirementRow = styled.Pressable<{ $expanded?: boolean }>(
  ({ theme, $expanded }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    minHeight: 58,
    backgroundColor: $expanded
      ? theme.colors.surfaceElevated
      : theme.colors.surface,
  }),
);
export const Status = styled.View<{ $ready?: boolean }>(
  ({ theme, $ready }) => ({
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    backgroundColor: $ready
      ? theme.dashboard.successSoft
      : theme.dashboard.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  }),
);
export const Detail = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  paddingLeft: theme.spacing.md + 30,
  gap: theme.spacing.sm,
}));
export const Actions = styled.View(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing.md,
}));
export const TextAction = styled.Pressable({
  minHeight: 44,
  justifyContent: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
});
export const ActionLabel = styled(AppText).attrs({
  variant: 'label' as const,
  color: 'accent' as const,
})({});
export const SmallAction = styled.Pressable(({ theme }) => ({
  minHeight: 36,
  paddingHorizontal: theme.spacing.sm,
  borderRadius: theme.radius.sm,
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const DownloadBody = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  gap: theme.spacing.sm,
}));
export const Checkbox = styled.View<{ $checked: boolean }>(
  ({ theme, $checked }) => ({
    width: 20,
    height: 20,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: $checked ? theme.colors.primary : theme.colors.controlBorder,
    backgroundColor: $checked ? theme.colors.primary : theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  }),
);

export const SourceLink = styled(TextAction)({
  minHeight: 24,
  alignSelf: 'flex-start',
});
