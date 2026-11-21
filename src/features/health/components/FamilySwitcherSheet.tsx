import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircle2, ChevronRight, Circle, UserRound, Users, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { humanizeLabel } from '../../../utils/format';

export function FamilySwitcherSheet({
  visible, members, selected, onSelect, onClose, onManageFamily, onDismiss,
}: {
  visible: boolean;
  members: HealthMember[];
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onManageFamily: () => void;
  onDismiss?: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.colors;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close family switcher"
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: colors.overlay.scrim }]}
        />
        <View style={[styles.sheet, {
          backgroundColor: colors.surface.canvas,
          borderColor: colors.border.default,
          paddingBottom: Math.max(24, insets.bottom + 8),
        }]}>
          <View style={[styles.handle, { backgroundColor: colors.border.default }]} />
          <View style={styles.heading}>
            <AppText variant="moduleTitle" style={styles.grow}>Choose family member</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close family switcher" onPress={onClose} style={styles.close}>
              <X size={sizes.icon.md} color={colors.icon.interactive} />
            </Pressable>
          </View>
          <AppText variant="caption" color="secondary">
            Choose whose health information you want to view.
          </AppText>
          <ScrollView
            style={styles.memberList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
          >
            {members.length ? members.map(member => {
              const isSelected = member.id === selected;
              return (
                <Pressable
                  key={member.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${member.name}, ${humanizeLabel(member.relation) || 'Family member'}`}
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => onSelect(member.id)}
                  style={[styles.row, {
                    backgroundColor: isSelected ? colors.selection.surface : colors.surface.default,
                    borderColor: isSelected ? colors.border.interactive : colors.border.default,
                  }]}
                >
                  <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}>
                    <UserRound size={sizes.icon.md} color={colors.icon.interactive} />
                  </View>
                  <View style={styles.grow}>
                    <AppText variant="compactLabel">{member.name}</AppText>
                    <AppText variant="caption" style={{ color: colors.text.interactive }}>
                      {humanizeLabel(member.relation) || 'Family member'}
                    </AppText>
                  </View>
                  {isSelected
                    ? <CheckCircle2 size={sizes.icon.sm} color={colors.icon.interactive} />
                    : <Circle size={sizes.icon.sm} color={colors.icon.interactive} />}
                </Pressable>
              );
            }) : (
              <AppText variant="bodySm" color="secondary">No health profiles yet.</AppText>
            )}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onManageFamily}
            style={[styles.row, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
          >
            <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}>
              <Users size={sizes.icon.md} color={colors.icon.interactive} />
            </View>
            <View style={styles.grow}>
              <AppText variant="compactLabel">Manage family</AppText>
              <AppText variant="caption" style={{ color: colors.text.interactive }}>
                Add or edit health profiles
              </AppText>
            </View>
            <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
          </Pressable>
          <AppText variant="caption" color="muted">
            Switching profiles changes the health information shown.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    maxHeight: '85%', borderWidth: 1, borderBottomWidth: 0,
    borderTopLeftRadius: radius.overlay, borderTopRightRadius: radius.overlay,
    paddingHorizontal: 16, paddingTop: 12, gap: 12,
  },
  handle: { width: 36, height: 4, borderRadius: radius.pill, alignSelf: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1, minWidth: 0 },
  close: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  memberList: { flexGrow: 0 },
  listContent: { gap: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  iconWell: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
});
