import React from 'react';
import { ChevronRight, IdCard } from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
import { ReadinessRing } from '../../components/primitives/ReadinessRing';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Row = styled.Pressable(({ theme }) => ({
  minHeight: 76,
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: theme.spacing.sm + theme.spacing.xs,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.lg,
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.xs }));
const Heading = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
const Title = styled(AppText).attrs({ variant: 'rowTitle', numberOfLines: 1 })(
  () => ({ flex: 1 }),
);
const Badge = styled.View(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Stamp = styled.View(({ theme }) => ({
  borderWidth: 1,
  borderColor: theme.colors.success,
  borderRadius: theme.radius.sm,
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
}));
export function PackageRow({
  title,
  percentage,
  ready,
  total,
  onPress,
}: {
  title: string;
  percentage: number;
  ready: number;
  total: number;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const complete = total > 0 && ready === total;
  return (
    <Row
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${percentage}% ready`}
      onPress={onPress}
    >
      <ReadinessRing score={percentage} size={38} />
      <Copy>
        <Heading>
          <Badge>
            <IdCard size={14} color={theme.colors.primary} />
          </Badge>
          <Title>{title}</Title>
        </Heading>
        <AppText variant="caption" color="muted">
          {complete ? 'Everything in place' : `${ready} of ${total} ready`}
        </AppText>
      </Copy>
      {complete ? (
        <Stamp>
          <AppText variant="caption" color="success">
            READY
          </AppText>
        </Stamp>
      ) : (
        <ChevronRight size={18} color={theme.colors.textMuted} />
      )}
    </Row>
  );
}
