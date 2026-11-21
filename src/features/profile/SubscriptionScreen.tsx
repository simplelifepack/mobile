import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import type { RootStackParamList } from '../../app/navigation/types';
import { accountApi, type AccountUsage } from '../../api/account.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { sizes } from '../../design/tokens/sizes';
import { subscriptionPlans } from './subscriptionPlans';

export function SubscriptionScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [usage, setUsage] = useState<AccountUsage>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    accountApi.usage().then(result => {
      if (active) setUsage(result);
    }).catch(loadError => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load account status.');
    });
    return () => { active = false; };
  }, []);

  const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  return (
    <Screen scroll>
      <Stack gap="md" style={styles.container}>
        <Row align="center" gap="sm">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()}>
            <ArrowLeft size={sizes.icon.md} color={theme.colors.text.primary} />
          </Pressable>
          <AppText variant="title">Subscription</AppText>
        </Row>
        <Card>
          <Stack gap="xs">
            <AppText variant="heading">Your account</AppText>
            <AppText color="secondary">
              {usage ? `${usage.accountTier === 'paid' ? 'Paid' : 'Free'} account` : error ? 'Account status unavailable' : 'Loading account status…'}
            </AppText>
            {error ? <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText> : null}
          </Stack>
        </Card>
        <AppText variant="heading">Mobile plans</AppText>
        <AppText color="secondary">
          Mobile subscriptions are not available yet. Prices will be shown when {store} billing is ready.
        </AppText>
        {subscriptionPlans.map(plan => (
          <Card key={plan.id}>
            <Stack gap="sm">
              <AppText variant="heading">{plan.title}</AppText>
              <AppText variant="caption" color="secondary">{plan.description} · Price unavailable</AppText>
              <Button title="Not available yet" disabled accessibilityLabel={`${plan.title} subscription not available yet`} />
            </Stack>
          </Card>
        ))}
        <Button title="Restore purchases unavailable" variant="secondary" disabled />
        <AppText variant="caption" color="secondary">
          Existing paid access is not affected. No payment will be taken from this screen.
        </AppText>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16 },
});
