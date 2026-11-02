import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { LoadingState } from './LoadingState';
import { radius } from '../../design/tokens/radius';

export function ProcessingOverlay({ visible, label }: { visible: boolean; label: string }) {
  const { theme } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay.scrim }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface.canvas }]}>
          <LoadingState label={label} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', },
  card: { borderRadius: radius.overlay, paddingHorizontal: 32, paddingVertical: 8 },
});
