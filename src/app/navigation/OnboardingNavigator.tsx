import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import { OnboardingScreen } from '../../features/onboarding/OnboardingScreen';
const Stack = createNativeStackNavigator<OnboardingStackParamList>();
export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={OnboardingScreen} />
      <Stack.Screen name="ReadinessIntro" component={OnboardingScreen} />
      <Stack.Screen name="PrivacyIntro" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
