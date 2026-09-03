import React from 'react';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
export function DocumentsScreen() {
  return (
    <Screen>
      <Stack gap="sm" style={{ paddingTop: 24 }}>
        <AppText variant="title">Documents</AppText>
        <AppText color="secondary">
          Your private document library will live here.
        </AppText>
      </Stack>
    </Screen>
  );
}
