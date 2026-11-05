import React from 'react';
import { Modal } from 'react-native';
import { LoadingState } from './LoadingState';

export function ProcessingOverlay({ visible, label }: { visible: boolean; label: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <LoadingState overlay size={48} label={label} />
    </Modal>
  );
}
