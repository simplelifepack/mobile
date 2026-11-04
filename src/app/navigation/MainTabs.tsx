import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { TabBar } from '../../components/navigation/TabBar';
import { HomeScreen } from '../../features/home/HomeScreen';
import { DocumentsScreen } from '../../features/documents/DocumentsScreen';
import { ReadinessScreen } from '../../features/readiness/ReadinessScreen';
import { HealthScreen } from '../../features/health/HealthScreen';
import { WealthScreen } from '../../features/wealth/WealthScreen';
const Tabs = createBottomTabNavigator<MainTabParamList>();
export function MainTabs({
  onInitialReady,
}: { onInitialReady?: () => void } = {}) {
  const renderHome = React.useCallback(
    () => <HomeScreen onInitialReady={onInitialReady} />,
    [onInitialReady],
  );
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={TabBar}>
      <Tabs.Screen name="Home">{renderHome}</Tabs.Screen>
      <Tabs.Screen name="Documents" component={DocumentsScreen} />
      <Tabs.Screen
        name="Readiness"
        component={ReadinessScreen}
        options={{ title: 'Packages' }}
      />
      <Tabs.Screen name="Health" component={HealthScreen} />
      <Tabs.Screen name="Wealth" component={WealthScreen} />
    </Tabs.Navigator>
  );
}
