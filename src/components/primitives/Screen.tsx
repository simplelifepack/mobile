import React from 'react';
import {
  RefreshControl,
  StatusBar,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { layout } from '../../design/tokens/spacing';
const Safe = styled(SafeAreaView)(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.colors.surface.canvas,
}));
const Content = styled.View<{ padded: boolean }>(({ padded }) => ({
  flex: 1,
  width: '100%',
  maxWidth: layout.contentWidth,
  alignSelf: 'center',
  paddingHorizontal: padded ? layout.gutter : 0,
}));
const Scroll = styled.ScrollView.attrs<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>(({ contentContainerStyle }) => ({
  contentContainerStyle: [{ flexGrow: 1 }, contentContainerStyle],
}))<{ padded: boolean }>(({ padded }) => ({
  width: '100%',
  maxWidth: layout.contentWidth,
  alignSelf: 'center',
  paddingHorizontal: padded ? layout.gutter : 0,
}));
export function Screen({
  children,
  floatingAction,
  scroll = false,
  padded = true,
  contentContainerStyle,
  onRefresh,
}: React.PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  floatingAction?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onRefresh?: () => Promise<unknown> | void;
}>) {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      // Screens surface their own load errors.
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);
  const tabInset = React.useContext(BottomTabBarHeightContext) ?? 0;
  return (
    <Safe
      edges={tabInset ? ['top', 'left', 'right'] : undefined}
    >
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      {scroll ? (
        <Scroll
          padded={padded}
          scrollIndicatorInsets={{ bottom: tabInset }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.text.interactive}
                colors={[theme.colors.text.interactive]}
              />
            ) : undefined
          }
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: tabInset + 16 },
          ]}
        >
          {children}
        </Scroll>
      ) : (
        <Content padded={padded} style={{ paddingBottom: tabInset }}>
          {children}
        </Content>
      )}
      {floatingAction}
    </Safe>
  );
}
