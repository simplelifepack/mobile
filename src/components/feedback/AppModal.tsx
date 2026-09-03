import React from 'react';
import { Modal } from 'react-native';
import styled from 'styled-components/native';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Stack } from '../primitives/Stack';
const Backdrop = styled.View(({ theme }) => ({
  flex: 1,
  justifyContent: 'center',
  padding: theme.spacing.lg,
  backgroundColor: theme.colors.overlay,
}));
export function AppModal({
  visible,
  onClose,
  children,
}: React.PropsWithChildren<{ visible: boolean; onClose: () => void }>) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Backdrop>
        <Card>
          <Stack>
            {children}
            <Button title="Close" variant="secondary" onPress={onClose} />
          </Stack>
        </Card>
      </Backdrop>
    </Modal>
  );
}
