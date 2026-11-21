import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

type Props = {
  visible: boolean;
  holdingName: string;
  userName?: string;
  onViewHolding: () => void;
  onBackToWealth: () => void;
};

export function FamilyAccessNoteSavedScreen({
  visible,
  holdingName,
  userName,
  onViewHolding,
  onBackToWealth,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onViewHolding}
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.surface.canvas,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={[
            styles.navigation,
            { borderBottomColor: theme.colors.border.subtle },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to holding"
            hitSlop={12}
            onPress={onViewHolding}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Access note saved</AppText>
        </View>
        <View style={styles.context}>
          <AppText variant="caption" color="interactive">
            {userName ? `${userName} · You` : 'You'}
          </AppText>
          <AppText variant="caption" color="muted">
            Private Wealth register
          </AppText>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.success,
              { backgroundColor: theme.colors.status.success.surface },
            ]}
          >
            <AppText
              variant="label"
              style={{ color: theme.colors.status.success.text }}
            >
              Your family knows the next step
            </AppText>
            <AppText variant="bodySm">
              Instructions have been added to {holdingName}.
            </AppText>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.colors.surface.default },
            ]}
          >
            <CheckCircle2
              size={sizes.icon.md}
              color={theme.colors.status.success.text}
            />
            <View style={styles.summaryText}>
              <AppText variant="label">{holdingName} is family-ready</AppText>
              <AppText variant="bodySm" color="secondary">
                Holding details, nominee and access note stay together.
              </AppText>
            </View>
            <CheckCircle2
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </View>
          <View
            style={[
              styles.privateNotice,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              Private until handoff
            </AppText>
            <AppText variant="bodySm">
              Your trusted people will see this note only when you choose to
              send a handoff.
            </AppText>
          </View>
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="View holding" onPress={onViewHolding} />
          <Button
            title="Back to Wealth"
            variant="secondary"
            onPress={onBackToWealth}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navigation: {
    minHeight: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  context: {
    minHeight: 23,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  success: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 4,
  },
  summaryCard: {
    minHeight: sizes.listRow + 12,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: { flex: 1, gap: 4 },
  privateNotice: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 4,
  },
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
