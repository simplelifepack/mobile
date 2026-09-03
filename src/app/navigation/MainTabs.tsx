import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { TabBar } from '../../components/navigation/TabBar';
import { HomeScreen } from '../../features/home/HomeScreen';
import { DocumentsScreen } from '../../features/documents/DocumentsScreen';
import { ReadinessScreen } from '../../features/readiness/ReadinessScreen';
import { TrustScreen } from '../../features/trust/TrustScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
const Tabs = createBottomTabNavigator<MainTabParamList>();
export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Documents" component={DocumentsScreen} />
      <Tabs.Screen name="Readiness" component={ReadinessScreen} />
      <Tabs.Screen name="Trust" component={TrustScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
