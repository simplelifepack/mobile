import React from 'react';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
export function TrustScreen() {
  return (
    <Screen>
      <Stack gap="sm" style={{ paddingTop: 24 }}>
        <AppText variant="title">Trust</AppText>
        <AppText color="secondary">
          Security and trusted access controls will live here.
        </AppText>
      </Stack>
    </Screen>
  );
}
