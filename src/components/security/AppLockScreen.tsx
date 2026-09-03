import React, { useState } from 'react';
import { Screen } from '../primitives/Screen';
import { Stack } from '../primitives/Stack';
import { AppText } from '../primitives/AppText';
import { Button } from '../primitives/Button';
import { PinInput } from './PinInput';
export function AppLockScreen() {
  const [pin, setPin] = useState('');
  return (
    <Screen>
      <Stack gap="xl" style={{ flex: 1, justifyContent: 'center' }}>
        <Stack gap="sm" align="center">
          <AppText variant="title">Unlock Readiness</AppText>
          <AppText color="secondary" align="center">
            Use biometrics or your six-digit Readiness PIN.
          </AppText>
        </Stack>
        <PinInput value={pin} onChange={setPin} />
        <Button title="Unlock with biometrics" onPress={() => {}} />
        <Button
          title="Use PIN"
          variant="secondary"
          disabled={pin.length !== 6}
          onPress={() => {}}
        />
      </Stack>
    </Screen>
  );
}
