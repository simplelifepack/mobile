import React from 'react';
import { StatusBar, type StyleProp, type ViewStyle } from 'react-native';
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
const Scroll = styled.ScrollView.attrs<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>(({ contentContainerStyle }) => ({
  contentContainerStyle: [{ flexGrow: 1 }, contentContainerStyle],
}))<{ padded: boolean }>(({ theme, padded }) => ({
  paddingHorizontal: padded ? theme.spacing.md : 0,
}));
export function Screen({
  children,
  floatingAction,
  scroll = false,
  padded = true,
  contentContainerStyle,
}: React.PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  floatingAction?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>) {
  const { theme } = useAppTheme();
  return (
    <Safe>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {scroll ? (
        <Scroll padded={padded} contentContainerStyle={contentContainerStyle}>
          {children}
        </Scroll>
      ) : (
        <Content padded={padded}>{children}</Content>
      )}
      {floatingAction}
    </Safe>
  );
}
