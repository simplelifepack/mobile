import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../components/primitives/AppText';
import { ListGroup, ListRow } from '../../../components/primitives/ListRow';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import type { HealthMember } from '../../../api/health.api';

const NOT_ADDED = 'Not added';

export function EmergencyInfoSheet({
  member,
  visible,
  onClose,
}: {
  member?: HealthMember;
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const phone = member?.emergencyContactPhone;

  const rows = [
    { title: 'Blood group', value: member?.bloodGroup },
    { title: 'Allergies', value: member?.allergies },
    { title: 'Conditions', value: member?.conditions },
    { title: 'Primary doctor', value: member?.primaryDoctor },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close emergency info"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.default,
              paddingBottom: Math.max(theme.spacing.md, insets.bottom + 8),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <View style={styles.header}>
            <AppText variant="heading">Emergency info{member ? ` · ${member.name}` : ''}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Done" hitSlop={12} onPress={onClose}>
              <AppText variant="label" style={{ color: theme.colors.text.interactive }}>Done</AppText>
            </Pressable>
          </View>
          <ListGroup>
            <ListRow
              title={member?.emergencyContactName ?? 'Emergency contact'}
              subtitle={phone ?? NOT_ADDED}
              icon={<Phone size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />}
              onPress={phone ? () => { Linking.openURL(`tel:${phone}`); } : undefined}
            />
            {rows.map(row => (
              <ListRow key={row.title} title={row.title} subtitle={row.value || NOT_ADDED} />
            ))}
          </ListGroup>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: { width: sizes.sheetHandle.width, height: sizes.sheetHandle.height, borderRadius: radius.pill, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
});
