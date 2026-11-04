import React from 'react';
import { sessionGateEmail } from '../../security/sessionGate';
import { NetworkBanner } from '../../network/NetworkBanner';
import { SessionGuard } from '../../security/SessionGuard';
import { Modal, type ModalProps } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Each native modal is a separate presentation root with its own safe area.
export function AppModal({ children, ...props }: ModalProps) {
  return (
    <Modal
      {...props}
      onRequestClose={event => {
        if (!sessionGateEmail()) props.onRequestClose?.(event);
      }}
    >
      <SafeAreaProvider>
        <SessionGuard>
          <NetworkBanner />
          {children}
        </SessionGuard>
      </SafeAreaProvider>
    </Modal>
  );
}
