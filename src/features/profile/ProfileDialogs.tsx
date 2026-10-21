import React from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';

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
      <View style={styles.backdrop}>
        <View style={[styles.currencyPanel, { backgroundColor: theme.colors.background }]}>
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
                    borderColor: theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.surfaceElevated
                      : theme.colors.surface,
                  },
                ]}
              >
                <AppText style={styles.currencyText}>{item}</AppText>
                {selected ? (
                  <View
                    style={[
                      styles.selectedDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
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
      <View style={styles.backdrop}>
        <View style={[styles.deletePanel, { backgroundColor: theme.colors.background }]}>
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
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
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
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
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
                styles.deleteButton,
                { opacity: valid ? 1 : 0.45 },
              ]}
            >
              <AppText style={[styles.actionText, styles.deleteText]}>
                Schedule deletion
              </AppText>
            </Pressable>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  currencyPanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  deletePanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  currencyOption: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currencyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  confirmLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
    fontSize: 15,
  },
  error: {
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    borderColor: '#F4776E',
    backgroundColor: '#F4776E',
  },
  deleteText: {
    color: '#1A0B0A',
  },
});