import React, { useEffect, useState } from 'react';
import { ArrowLeft, ContactRound } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

export type NomineeInformation = {
  name: string;
  relationship: string;
  phone: string;
  allocation: string;
  registrationStatus: string;
};

type Props = {
  visible: boolean;
  holdingName: string;
  accountReference: string;
  initialValue: NomineeInformation;
  userName?: string;
  onClose: () => void;
  onSave: (nominee: NomineeInformation) => void;
};

const emptyNominee: NomineeInformation = {
  name: '',
  relationship: '',
  phone: '',
  allocation: '100',
  registrationStatus: '',
};

export function NomineeInformationScreen({
  visible,
  holdingName,
  accountReference,
  initialValue,
  userName,
  onClose,
  onSave,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [nominee, setNominee] = useState(initialValue);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible) return;
    setNominee({ ...emptyNominee, ...initialValue });
    setError(undefined);
  }, [initialValue, visible]);

  const set = <K extends keyof NomineeInformation>(
    key: K,
    value: NomineeInformation[K],
  ) => {
    setNominee(current => ({ ...current, [key]: value }));
    setError(undefined);
  };

  const save = () => {
    if (!nominee.name.trim()) {
      setError('Enter the nominee’s full name.');
      return;
    }
    if (!nominee.relationship.trim()) {
      setError('Enter the nominee’s relationship to you.');
      return;
    }
    const allocation = Number(nominee.allocation);
    if (!Number.isFinite(allocation) || allocation <= 0 || allocation > 100) {
      setError('Enter an allocation greater than 0% and no more than 100%.');
      return;
    }
    onSave({
      ...nominee,
      name: nominee.name.trim(),
      relationship: nominee.relationship.trim(),
      phone: nominee.phone.trim(),
      allocation: String(allocation),
      registrationStatus: nominee.registrationStatus.trim(),
    });
  };

  const field = (
    label: string,
    key: keyof NomineeInformation,
    options: {
      required?: boolean;
      keyboardType?: 'default' | 'phone-pad' | 'number-pad';
      placeholder?: string;
      suffix?: string;
    } = {},
  ) => (
    <View style={styles.field}>
      <AppText variant="bodySm" color="secondary">
        {label}
        {options.required ? ' *' : ''}
      </AppText>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          value={nominee[key]}
          onChangeText={value => set(key, value)}
          placeholder={options.placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.text.tertiary}
          keyboardType={options.keyboardType ?? 'default'}
          autoCapitalize={key === 'phone' ? 'none' : 'words'}
          style={[styles.rowInput, { color: theme.colors.text.primary }]}
        />
        {options.suffix ? (
          <AppText variant="bodySm" color="secondary">
            {options.suffix}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
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
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={onClose}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Nominee information</AppText>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.holdingCard,
              { backgroundColor: theme.colors.surface.default },
            ]}
          >
            <ContactRound
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
            <View style={styles.holdingDetails}>
              <AppText variant="label" numberOfLines={1}>
                {holdingName}
                {accountReference ? ` · ${accountReference}` : ''}
              </AppText>
              <AppText variant="bodySm" color="secondary">
                Nominee for this holding
              </AppText>
            </View>
          </View>
          {field('Full name', 'name', { required: true })}
          {field('Relationship', 'relationship', { required: true })}
          {field('Phone (optional)', 'phone', {
            keyboardType: 'phone-pad',
            placeholder: '+91 98450 12345',
          })}
          {field('Allocation', 'allocation', {
            keyboardType: 'number-pad',
            suffix: '%',
          })}
          <AppText variant="caption" color="muted">
            If more than one nominee, allocations must total 100%.
          </AppText>
          {field('Registration status', 'registrationStatus', {
            placeholder: 'e.g. Registered with institution',
          })}
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <AppText variant="label" color="interactive">
              A record, not a nomination
            </AppText>
            <AppText variant="bodySm">
              Saving here records the details for your family. It does not
              register or change a legal nomination with the institution.
            </AppText>
          </View>
          {error ? (
            <AppText variant="bodySm" color="danger">
              {error}
            </AppText>
          ) : null}
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="Save nominee" onPress={save} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
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
    gap: 12,
  },
  holdingCard: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holdingDetails: { flex: 1, gap: 4 },
  field: { gap: 6 },
  inputRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 12,
  },
  rowInput: { flex: 1, minHeight: 40, borderWidth: 0 },
  notice: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 6,
  },
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
