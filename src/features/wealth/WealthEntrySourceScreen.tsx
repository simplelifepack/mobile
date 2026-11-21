import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  PenLine,
  Upload,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

export type WealthEntrySource = 'vault' | 'upload' | 'manual';
export type WealthEntryKind =
  'asset' | 'investment' | 'insurance' | 'loan' | 'transaction';

const titleByKind: Record<WealthEntryKind, string> = {
  asset: 'Add account',
  investment: 'Add account',
  insurance: 'Add insurance',
  loan: 'Add loan',
  transaction: 'Add transaction',
};

const sourceOptions: Array<{
  source: WealthEntrySource;
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    source: 'vault',
    title: 'Use an existing document',
    description: 'Choose a statement already in your vault.',
    Icon: FileText,
  },
  {
    source: 'upload',
    title: 'Upload a document',
    description: 'Add a PDF, JPG or PNG · Up to 20 MB',
    Icon: Upload,
  },
  {
    source: 'manual',
    title: 'Enter details manually',
    description: 'You can attach a document later.',
    Icon: PenLine,
  },
];

export function WealthEntrySourceScreen({
  visible,
  kind,
  userName,
  onClose,
  onDismiss,
  onSelectSource,
}: {
  visible: boolean;
  kind: WealthEntryKind;
  userName?: string;
  onClose: () => void;
  onDismiss?: () => void;
  onSelectSource: (source: WealthEntrySource) => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
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
            accessibilityLabel="Back to entry types"
            hitSlop={12}
            onPress={onClose}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">{titleByKind[kind]}</AppText>
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
          <AppText variant="heading">How would you like to start?</AppText>
          {sourceOptions.map(({ source, title, description, Icon }) => (
            <Pressable
              key={source}
              accessibilityRole="button"
              accessibilityLabel={title}
              onPress={() => onSelectSource(source)}
              style={[
                styles.option,
                { backgroundColor: theme.colors.surface.default },
              ]}
            >
              <Icon
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
              <View style={styles.optionText}>
                <AppText variant="label">{title}</AppText>
                <AppText variant="bodySm" color="secondary">
                  {description}
                </AppText>
              </View>
              <ChevronRight
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
            </Pressable>
          ))}
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              You stay in control
            </AppText>
            <AppText variant="bodySm">
              {kind === 'transaction'
                ? 'Check the transaction details and attached proof before saving.'
                : 'When you use a document, review and confirm the extracted details before saving.'}
            </AppText>
          </View>
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="Back to entry types" onPress={onClose} />
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
  option: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: { flex: 1, gap: 4 },
  notice: {
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
