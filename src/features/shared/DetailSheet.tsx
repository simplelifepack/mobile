import { DialogHeader } from './DialogHeader';
import React from 'react';
import { AppModal as Modal } from '../../components/primitives/AppModal';
import {
  ModalSurface,
  ModalOptions,
  ModalContent,
} from '../../components/primitives/Layout';
import { Button } from '../../components/primitives/Button';
export function DetailSheet({
  title,
  onClose,
  children,
  busy = false,
  footer,
  onShow,
}: React.PropsWithChildren<{
  title: string;
  onClose: () => void;
  busy?: boolean;
  footer?: React.ReactNode;
  onShow?: () => void;
}>) {
  return (
    <Modal
      visible
      onShow={onShow}
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <ModalSurface>
        <DialogHeader title={title} onClose={onClose} disabled={busy} />
        <ModalOptions keyboardShouldPersistTaps="handled">
          <ModalContent>
            {children}
            {!footer ? (
              <Button
                title="Close"
                variant="secondary"
                disabled={busy}
                onPress={onClose}
              />
            ) : null}
          </ModalContent>
        </ModalOptions>
        {footer ? <ModalContent>{footer}</ModalContent> : null}
      </ModalSurface>
    </Modal>
  );
}
