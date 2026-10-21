import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, RootStackParamList } from './types';
import { useAppSelector } from '../store/hooks';
import { TabBar } from '../../components/navigation/TabBar';
import { HomeScreen } from '../../features/home/HomeScreen';
import { DocumentsScreen } from '../../features/documents/DocumentsScreen';
import { ReadinessScreen } from '../../features/readiness/ReadinessScreen';
import { HealthScreen } from '../../features/health/HealthScreen';
import { WealthScreen } from '../../features/wealth/WealthScreen';
const Tabs = createBottomTabNavigator<MainTabParamList>();

function WealthTab() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Wealth'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const authStatus = useAppSelector(state => state.auth.status);
  const guestPreview = __DEV__ && authStatus === 'unauthenticated';

  return (
    <WealthScreen
      guestPreview={guestPreview}
      onSignIn={() =>
        navigation
          .getParent<NativeStackNavigationProp<RootStackParamList>>()
          ?.navigate('Auth')
      }
    />
  );
}

export function MainTabs() {
  const authStatus = useAppSelector(state => state.auth.status);
  const guestPreview = __DEV__ && authStatus === 'unauthenticated';

  return (
    <Tabs.Navigator
      initialRouteName={guestPreview ? 'Wealth' : 'Home'}
      screenOptions={{ headerShown: false }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Documents" component={DocumentsScreen} />
      <Tabs.Screen name="Packages" component={ReadinessScreen} />
      <Tabs.Screen name="Health" component={HealthScreen} />
      <Tabs.Screen name="Wealth" component={WealthTab} />
    </Tabs.Navigator>
  );
}
