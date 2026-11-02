import React from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View, KeyboardAvoidingView } from 'react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight, fontWeights} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

type CurrencyPickerModalProps = {
  visible: boolean;
  currency?: string | null;
  currencies: string[];
  onSelect: (currency: string) => void;
  onClose: () => void;
};

export function CurrencyPickerModal({
  visible,
  currency,
  currencies,
  onSelect,
  onClose,
}: CurrencyPickerModalProps) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={[styles.backdrop, { backgroundColor: theme.colors.overlay.scrim }]}>
        <View style={[styles.currencyPanel, { backgroundColor: theme.colors.surface.canvas }]}>
          <View style={styles.header}>
            <AppText style={styles.title}>Home currency</AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <AppText style={styles.close} color="secondary">Close</AppText>
            </Pressable>
          </View>
          <AppText style={styles.description} color="secondary">
            Select the currency used for indicative rates in ReadiNes.
          </AppText>
          {currencies.map(item => {
            const selected = currency === item;
            return (
              <Pressable
                key={item}
                onPress={() => onSelect(item)}
                style={[
                  styles.currencyOption,
                  {
                    borderColor: theme.colors.border.default,
                    backgroundColor: selected
                      ? theme.colors.surface.raised
                      : theme.colors.surface.default,
                  },
                ]}
              >
                <AppText style={styles.currencyText}>{item}</AppText>
                {selected ? (
                  <View
                    style={[
                      styles.selectedDot,
                      { backgroundColor: theme.colors.action.primary.default },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type DeleteAccountModalProps = {
  visible: boolean;
  phrase: string;
  error?: string;
  onPhraseChange: (value: string) => void;
  onClose: () => void;
  onSchedule: () => void;
};

export function DeleteAccountModal({
  visible,
  phrase,
  error,
  onPhraseChange,
  onClose,
  onSchedule,
}: DeleteAccountModalProps) {
  const { theme } = useAppTheme();
  const valid = phrase === 'delete my account';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={[styles.backdrop, { backgroundColor: theme.colors.overlay.scrim }]}>
        <View style={[styles.deletePanel, { backgroundColor: theme.colors.surface.canvas }]}>
          <AppText style={styles.title}>Schedule account deletion</AppText>
          <AppText style={styles.description} color="secondary">
            Your account and data will be permanently deleted after 30 days. Sign in again during that period to cancel.
          </AppText>
          <AppText style={styles.confirmLabel} color="secondary">
            Type delete my account to confirm
          </AppText>
          <TextInput
            value={phrase}
            onChangeText={onPhraseChange}
            autoCapitalize="none"
            placeholder="delete my account"
            placeholderTextColor={theme.colors.text.tertiary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                color: theme.colors.text.primary,
              },
            ]}
          />
          {error ? (
            <AppText style={styles.error} color="danger">{error}</AppText>
          ) : null}
          <Row gap="sm" style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[
                styles.actionButton,
                {
                  borderColor: theme.colors.border.default,
                  backgroundColor: theme.colors.surface.default,
                },
              ]}
            >
              <AppText style={styles.actionText}>Cancel</AppText>
            </Pressable>
            <Pressable
              disabled={!valid}
              onPress={onSchedule}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.action.destructive.default,
                  borderColor: theme.colors.action.destructive.default,
                  opacity: valid ? 1 : 0.45,
                },
              ]}
            >
              <AppText style={[styles.actionText, { color: theme.colors.text.onBrand }]}>
                Schedule deletion
              </AppText>
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  currencyPanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
  },
  deletePanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.headingLg,
    lineHeight: lineHeight.headingLg,
    fontWeight: fontWeights.bold,
  },
  close: {
    fontSize: fontSize.body,
    fontWeight: fontWeights.semibold,
  },
  description: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    marginBottom: 8,
  },
  currencyOption: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currencyText: {
    fontSize: fontSize.headingSm,
    fontWeight: fontWeights.semibold,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: radius.control,
  },
  confirmLabel: {
    fontSize: fontSize.bodySm,
    marginTop: 2,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    fontSize: fontSize.body,
  },
  error: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },
  actions: {
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: fontSize.body,
    fontWeight: fontWeights.bold,
  },
});