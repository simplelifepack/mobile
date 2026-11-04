import React from 'react';
import styled from 'styled-components/native';
import { WifiOff, CloudOff, Clock3 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/primitives/AppText';
import { Progress } from '../components/primitives/Progress';
import { useAppTheme } from '../design/theme/ThemeProvider';
import { useConnectivity } from './connectivity';
import { useActivity } from './activity';
const Notice = styled.View(({ theme }) => ({
  paddingHorizontal: theme.spacing.md,
  paddingVertical: theme.spacing.sm,
  backgroundColor: theme.colors.surfaceElevated,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  gap: theme.spacing.xs,
}));
const Line = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
const Copy = styled(AppText)({ flex: 1 });
export function NetworkBanner() {
  const { theme } = useAppTheme();
  const network = useConnectivity();
  const activity = useActivity();
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    setSlow(false);
    if (!activity.active) return;
    const timer = setTimeout(
      () => setSlow(true),
      Math.max(0, 10000 - (Date.now() - activity.started)),
    );
    return () => clearTimeout(timer);
  }, [activity.started, activity.active]);
  if (!network.offline && !network.unreachable && !slow) return null;
  const Icon = network.offline
    ? WifiOff
    : network.unreachable
      ? CloudOff
      : Clock3;
  const message = network.offline
    ? 'Offline · showing saved information'
    : network.unreachable
      ? 'Can’t connect right now · your work is kept'
      : 'Taking a little longer…';
  const transfer = activity.transfer;
  return (
    <SafeAreaView edges={[]}>
      <Notice>
        <Line>
          <Icon size={16} color={theme.colors.textMuted} />
          <Copy
            variant="caption"
            color="secondary"
            accessibilityLiveRegion="polite"
          >
            {message}
          </Copy>
        </Line>
        {transfer && !network.offline && !network.unreachable ? (
          <>
            <AppText variant="caption" color="muted">
              {Math.round(transfer.read / 1024)} KB{' '}
              {activity.direction === 'upload' ? 'sent' : 'downloaded'}
              {transfer.total > 0
                ? ` of ${Math.round(transfer.total / 1024)} KB`
                : ''}
            </AppText>
            {transfer.total > 0 ? (
              <Progress
                value={(transfer.read / transfer.total) * 100}
                label="File progress"
              />
            ) : null}
          </>
        ) : null}
      </Notice>
    </SafeAreaView>
  );
}
