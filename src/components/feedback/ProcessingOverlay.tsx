import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { LoadingState } from './LoadingState';

export function ProcessingOverlay({ visible, label }: { visible: boolean; label: string }) {
  const { theme } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
          <LoadingState label={label} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 8 },
});
