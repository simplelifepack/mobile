import React, { useState } from 'react';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { TextInput } from '../../components/primitives/TextInput';
import { Badge } from '../../components/primitives/Badge';
import { Select } from '../../components/primitives/Select';
import { AppModal } from '../../components/feedback/AppModal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAppTheme } from '../../design/theme/ThemeProvider';
export function DesignSystemScreen() {
  const [modal, setModal] = useState(false);
  const { mode, setMode } = useAppTheme();
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: 24 }}>
        {(
          ['display', 'title', 'heading', 'body', 'label', 'caption'] as const
        ).map(variant => (
          <AppText key={variant} variant={variant}>
            {variant}
          </AppText>
        ))}
        <Button title="Primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <Card>
          <AppText>Card content</AppText>
        </Card>
        <TextInput label="Input" placeholder="Placeholder" />
        <Select
          label="Theme"
          value={mode}
          onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        />
        <Badge label="Badge" />
        <LoadingState />
        <Button title="Show modal" onPress={() => setModal(true)} />
        <AppModal visible={modal} onClose={() => setModal(false)}>
          <AppText variant="title">Reusable modal</AppText>
        </AppModal>
      </Stack>
    </Screen>
  );
}
