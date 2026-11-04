import styled from 'styled-components/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/primitives/AppText';
export const HomeSafe = styled(SafeAreaView).attrs({ edges: ['top'] as const })(
  ({ theme }) => ({ flex: 1, backgroundColor: theme.dashboard.background }),
);
export const HomeScroll = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: { paddingBottom: theme.sizes.navigationClearance },
  showsVerticalScrollIndicator: false,
}))({ flex: 1 });
export const HomeContent = styled.View(({ theme }) => ({
  paddingHorizontal: theme.spacing.md,
  paddingTop: theme.spacing.lg,
  width: '100%',
  maxWidth: 680,
  alignSelf: 'center',
  gap: theme.spacing.sm + theme.spacing.xs,
}));
export const Copy = styled(AppText)(({ theme }) => ({
  color: theme.dashboard.muted,
}));
export const Label = styled(AppText).attrs({ variant: 'label' })(
  ({ theme }) => ({ color: theme.dashboard.text }),
);
export type Tone = 'accent' | 'danger' | 'success' | 'warning' | 'info';
export const ToneText = styled(AppText)<{ $tone: Tone }>(
  ({ theme, $tone }) => ({ color: theme.dashboard[$tone] }),
);
export const Banner = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: theme.spacing.sm + theme.spacing.xs,
  borderWidth: 1,
  borderColor: theme.dashboard.accent,
  borderRadius: theme.radius.lg,
  backgroundColor: theme.dashboard.accentSoft,
  minHeight: 56,
}));
export const IconBadge = styled.View<{ $solid?: boolean; $soft?: boolean }>(
  ({ theme, $solid, $soft }) => ({
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    backgroundColor: $solid
      ? theme.dashboard.accent
      : $soft
        ? theme.dashboard.accentSoft
        : theme.dashboard.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  }),
);
export const ListCopy = styled.View(({ theme }) => ({
  flex: 1,
  gap: theme.spacing.xs,
}));
export const MetricCopy = styled.View({ flex: 1, gap: 0 });
export const MetricGrid = styled.View(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: theme.spacing.sm + theme.spacing.xs,
}));
export const MetricTile = styled.Pressable(({ theme }) => ({
  flexGrow: 1,
  flexBasis: '46%',
  minWidth: 0,
  padding: theme.spacing.md - theme.spacing.xs,
  gap: theme.spacing.sm,
  minHeight: 148,
  borderWidth: 1,
  borderColor: theme.dashboard.border,
  borderRadius: theme.radius.panel,
  backgroundColor: theme.dashboard.surface,
}));
export const TileTop = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});
export const CountBadge = styled.View<{ $tone: Tone }>(({ theme, $tone }) => ({
  minWidth: 21,
  height: 21,
  paddingHorizontal: theme.spacing.xs,
  borderRadius: theme.radius.pill,
  backgroundColor:
    $tone === 'accent'
      ? theme.dashboard.accentSoft
      : theme.dashboard[`${$tone}Soft`],
  alignItems: 'center',
  justifyContent: 'center',
}));
export const Value = styled(AppText).attrs({ variant: 'metric' })(
  ({ theme }) => ({
    color: theme.dashboard.text,
    lineHeight: '26px',
  }),
);
export const LinkRow = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.xs,
  marginTop: 'auto',
}));
export const Panel = styled.View(({ theme }) => ({
  borderWidth: 1,
  borderColor: theme.dashboard.border,
  borderRadius: theme.radius.panel,
  backgroundColor: theme.dashboard.surface,
  overflow: 'hidden',
}));
export const PanelHeader = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing.md - theme.spacing.xs,
  gap: theme.spacing.sm,
  minHeight: theme.sizes.minimumTouchTarget,
}));
export const TaskRow = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  paddingHorizontal: theme.spacing.md - theme.spacing.xs,
  paddingVertical: theme.spacing.sm,
  minHeight: 56,
  borderTopWidth: 1,
  borderTopColor: theme.dashboard.border,
}));
export const TaskCopy = styled.View({ flex: 1, gap: 0 });
export const PanelCount = styled.View(({ theme }) => ({
  minWidth: 19,
  height: 19,
  paddingHorizontal: theme.spacing.xs,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.dashboard.accent,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const PanelCountText = styled(AppText).attrs({ variant: 'caption' })(
  ({ theme }) => ({ color: theme.dashboard.onAccent, fontWeight: '700' }),
);
export const ShowAll = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.minimumTouchTarget,
  padding: theme.spacing.sm,
  alignItems: 'center',
  justifyContent: 'center',
  borderTopWidth: 1,
  borderTopColor: theme.dashboard.border,
}));
export const ProgressTrack = styled.View(({ theme }) => ({
  height: 4,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.dashboard.elevated,
}));
export const ProgressFill = styled.View<{ $value: number }>(
  ({ theme, $value }) => ({
    height: '100%',
    width: `${Math.max(0, Math.min(100, $value))}%`,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.dashboard.accent,
  }),
);
