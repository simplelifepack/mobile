import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Safe = styled(SafeAreaView)(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.colors.background,
}));
const Content = styled.View<{ padded: boolean }>(({ theme, padded }) => ({
  flex: 1,
  paddingHorizontal: padded ? theme.spacing.md : 0,
}));
const Scroll = styled.ScrollView.attrs({
  contentContainerStyle: { flexGrow: 1 },
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'interactive' as const,
  automaticallyAdjustKeyboardInsets: true,
})<{ padded: boolean }>(({ theme, padded }) => ({
  paddingHorizontal: padded ? theme.spacing.md : 0,
}));
export function Screen({
  children,
  scroll = false,
  padded = true,
  bottomInset = true,
}: React.PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  bottomInset?: boolean;
}>) {
  const { theme } = useAppTheme();
  return (
    <Safe edges={bottomInset ? ['top', 'bottom'] : ['top']}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {scroll ? (
        <Scroll padded={padded}>{children}</Scroll>
      ) : (
        <Content padded={padded}>{children}</Content>
      )}
    </Safe>
  );
}
