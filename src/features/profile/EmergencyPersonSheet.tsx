import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  View,
} from 'react-native';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ContactRound,
  UserRoundX,
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type {
  TrustMember,
  TrustMemberPayload,
  TrustRelation,
} from '../../api/trust.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';
import { sizes } from '../../design/tokens/sizes';
import { radius } from '../../design/tokens/radius';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { HealthField } from '../health/components/HealthForms';
import { accessDescriptions, permissionsForAccess } from './emergencyAccess';

const relations: ReadonlyArray<{ value: TrustRelation; label: string }> = [
  { value: 'SPOUSE', label: 'Spouse' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'CHILD', label: 'Child' },
  { value: 'SIBLING', label: 'Sibling' },
  { value: 'GUARDIAN', label: 'Guardian' },
  { value: 'RELATIVE', label: 'Relative' },
  { value: 'FRIEND', label: 'Friend' },
  { value: 'OTHER', label: 'Other' },
];
export function EmergencyPersonSheet({
  person,
  userName,
  onClose,
  onSave,
  onRemove,
}: {
  person?: TrustMember;
  userName?: string;
  onClose: () => void;
  onSave: (payload: TrustMemberPayload) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState(person?.name ?? '');
  const [email, setEmail] = useState(person?.email ?? '');
  const [phone, setPhone] = useState(person?.phone ?? '');
  const [relation, setRelation] = useState<TrustRelation | ''>(
    person?.relation ?? '',
  );
  const [customRelation, setCustomRelation] = useState(
    person?.customRelation ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [relationshipPickerVisible, setRelationshipPickerVisible] =
    useState(false);
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);

  const save = () => {
    if (
      !name.trim() ||
      !relation ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      (relation === 'OTHER' && !customRelation.trim())
    ) {
      setError('Enter a name, valid email and relation.');
      return;
    }
    if (!person && !permissionConfirmed) {
      setError('Confirm that you have this person’s permission to add them.');
      return;
    }
    if (phone.trim() && !/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      setError(
        'Enter the phone in international format, for example +919876543210.',
      );
      return;
    }
    const payload: TrustMemberPayload = {
      name: name.trim(),
      email: email.trim(),
      relation,
      ...(phone.trim() !== (person?.phone ?? '')
        ? { phone: phone.trim() || null }
        : {}),
      customRelation:
        relation === 'OTHER'
          ? customRelation.trim()
          : person?.relation === relation && person.customRelation
            ? person.customRelation
            : relations.find(item => item.value === relation)!.label,
      accessTypeCode: person?.accessType.id ?? 'EMERGENCY_ACCESS',
      permissions:
        person?.permissions ?? permissionsForAccess('EMERGENCY_ACCESS'),
    };
    const submit = async () => {
      setSaving(true);
      setError(undefined);
      try {
        await onSave(payload);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save this person.',
        );
      } finally {
        setSaving(false);
      }
    };
    if (!person) {
      Alert.alert('Confirm access', accessDescriptions.EMERGENCY_ACCESS, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            submit();
          },
        },
      ]);
    } else {
      submit();
    }
  };

  const confirmRemoval = async () => {
    if (!onRemove) return;
    setRemoving(true);
    setError(undefined);
    try {
      await onRemove();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Unable to remove this trusted person.',
      );
    } finally {
      setRemoving(false);
    }
  };

  const selectedRelation =
    relation === 'OTHER'
      ? customRelation || 'Other'
      : (relations.find(item => item.value === relation)?.label ??
        'Choose relationship');

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!saving) onClose();
      }}
    >
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.surface.canvas },
          ]}
        >
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          />
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Row align="center" gap="sm" style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                disabled={saving || removing}
                onPress={() =>
                  confirmingRemoval ? setConfirmingRemoval(false) : onClose()
                }
                style={styles.back}
              >
                <ChevronLeft
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                />
              </Pressable>
              <AppText variant="overviewTitle">
                {confirmingRemoval
                  ? 'Remove trusted person'
                  : person
                    ? 'Edit trusted person'
                    : 'Add trusted person'}
              </AppText>
            </Row>
            <Row
              align="center"
              justify="space-between"
              style={styles.familyContext}
            >
              <AppText variant="caption" color="interactive">
                {userName ? `${userName} · You` : 'You'}
              </AppText>
              <AppText variant="caption" color="secondary">
                Private Wealth register
              </AppText>
            </Row>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {confirmingRemoval && person ? (
                <>
                  <Card
                    style={[
                      styles.removeNotice,
                      {
                        backgroundColor: theme.colors.status.warning.surface,
                      },
                    ]}
                  >
                    <AppText
                      variant="label"
                      style={{ color: theme.colors.status.warning.text }}
                    >
                      Remove {person.name}?
                    </AppText>
                    <AppText variant="bodySm">
                      They will no longer appear when you select people for an
                      SOS handoff.
                    </AppText>
                  </Card>
                  <View
                    style={[
                      styles.removeRow,
                      { backgroundColor: theme.colors.surface.default },
                    ]}
                  >
                    <ContactRound
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                    <View style={styles.consentCopy}>
                      <AppText variant="label">
                        {person.name} · {person.relationLabel}
                      </AppText>
                      <AppText variant="bodySm" color="secondary">
                        {person.email}
                      </AppText>
                    </View>
                    <ChevronRight
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                  </View>
                  <AppText variant="bodySm" color="secondary">
                    This does not revoke a register already shared with them.
                  </AppText>
                </>
              ) : (
                <>
                  <HealthField
                    label="Full name *"
                    value={name}
                    onChangeText={value => {
                      setName(value);
                      setError(undefined);
                    }}
                    placeholder="Full name"
                    autoCapitalize="words"
                    maxLength={120}
                  />
                  <Stack gap="xs">
                    <AppText variant="label" color="secondary">
                      Relationship *
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Relationship: ${selectedRelation}`}
                      accessibilityState={{
                        expanded: relationshipPickerVisible,
                      }}
                      onPress={() => setRelationshipPickerVisible(true)}
                      style={[
                        styles.select,
                        {
                          backgroundColor: theme.colors.surface.default,
                          borderColor: theme.colors.border.default,
                        },
                      ]}
                    >
                      <AppText
                        variant="body"
                        color={relation ? 'primary' : 'muted'}
                      >
                        {selectedRelation}
                      </AppText>
                      <ChevronDown
                        size={sizes.icon.sm}
                        color={theme.colors.icon.secondary}
                      />
                    </Pressable>
                  </Stack>
                  {relation === 'OTHER' ? (
                    <HealthField
                      label="Relationship description *"
                      value={customRelation}
                      onChangeText={setCustomRelation}
                      placeholder="Describe the relationship"
                      maxLength={80}
                    />
                  ) : null}
                  <Stack gap="xs">
                    <HealthField
                      label="Email address *"
                      value={email}
                      onChangeText={value => {
                        setEmail(value);
                        setError(undefined);
                      }}
                      placeholder="name@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={254}
                      editable
                    />
                    {!person ? (
                      <AppText variant="caption" color="muted">
                        The secure handoff link and one-time code go here.
                      </AppText>
                    ) : null}
                  </Stack>
                  <HealthField
                    label="Phone (optional)"
                    value={phone}
                    onChangeText={value => {
                      setPhone(value);
                      setError(undefined);
                    }}
                    keyboardType="phone-pad"
                    placeholder="+919845024680"
                    maxLength={16}
                  />
                  {!person ? (
                    <>
                      <Card
                        style={[
                          styles.notice,
                          {
                            backgroundColor: theme.colors.surface.brandTint,
                          },
                        ]}
                      >
                        <AppText variant="label" color="interactive">
                          Ask them first
                        </AppText>
                        <AppText variant="bodySm">
                          Make sure this person agrees to be a trusted contact
                          and receive an invitation.
                        </AppText>
                      </Card>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: permissionConfirmed }}
                        onPress={() => {
                          setPermissionConfirmed(value => !value);
                          setError(undefined);
                        }}
                        style={[
                          styles.consent,
                          { backgroundColor: theme.colors.surface.default },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: permissionConfirmed
                                ? theme.colors.border.interactive
                                : theme.colors.border.default,
                            },
                          ]}
                        >
                          {permissionConfirmed ? (
                            <Check
                              size={sizes.icon.sm}
                              color={theme.colors.icon.interactive}
                            />
                          ) : null}
                        </View>
                        <View style={styles.consentCopy}>
                          <AppText variant="label">
                            I have their permission
                          </AppText>
                          <AppText variant="bodySm" color="secondary">
                            I confirm these contact details are correct.
                          </AppText>
                        </View>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Card
                        style={[
                          styles.notice,
                          {
                            backgroundColor: theme.colors.surface.brandTint,
                          },
                        ]}
                      >
                        <AppText variant="label" color="interactive">
                          Changing an email requires verification
                        </AppText>
                        <AppText variant="bodySm">
                          The updated address must be verified before it can
                          receive future handoffs.
                        </AppText>
                      </Card>
                      {onRemove ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Review trusted person removal"
                          disabled={saving}
                          onPress={() => {
                            setError(undefined);
                            setConfirmingRemoval(true);
                          }}
                          style={[
                            styles.removeRow,
                            { backgroundColor: theme.colors.surface.default },
                          ]}
                        >
                          <UserRoundX
                            size={sizes.icon.md}
                            color={theme.colors.icon.interactive}
                          />
                          <View style={styles.consentCopy}>
                            <AppText variant="label">
                              Remove trusted person
                            </AppText>
                            <AppText variant="bodySm" color="secondary">
                              Stops this contact receiving future handoffs.
                            </AppText>
                          </View>
                          <ChevronRight
                            size={sizes.icon.md}
                            color={theme.colors.icon.interactive}
                          />
                        </Pressable>
                      ) : null}
                    </>
                  )}
                </>
              )}
              {error ? (
                <AppText
                  variant="caption"
                  color="danger"
                  accessibilityRole="alert"
                >
                  {error}
                </AppText>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              {confirmingRemoval && person ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Confirm remove trusted person"
                    disabled={removing}
                    onPress={confirmRemoval}
                    style={[
                      styles.destructiveAction,
                      {
                        backgroundColor: theme.colors.status.danger.surface,
                        borderColor: theme.colors.border.destructive.default,
                      },
                      removing && styles.disabled,
                    ]}
                  >
                    <AppText
                      variant="action"
                      style={{ color: theme.colors.status.danger.text }}
                    >
                      {removing ? 'Removing…' : 'Remove trusted person'}
                    </AppText>
                  </Pressable>
                  <Button
                    title="Keep trusted person"
                    variant="secondary"
                    disabled={removing}
                    onPress={() => {
                      setError(undefined);
                      setConfirmingRemoval(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <Button
                    title={
                      saving
                        ? 'Saving…'
                        : person
                          ? 'Save changes'
                          : 'Save and send verification'
                    }
                    disabled={saving || removing}
                    onPress={save}
                  />
                  <Button
                    title="Cancel"
                    variant="secondary"
                    disabled={saving || removing}
                    onPress={onClose}
                  />
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
        <ActionSheet
          visible={relationshipPickerVisible}
          title="Relationship"
          onClose={() => setRelationshipPickerVisible(false)}
          options={relations.map(item => ({
            label: item.label,
            selected: item.value === relation,
            onPress: () => {
              if (item.value === 'OTHER' && relation !== 'OTHER') {
                setCustomRelation('');
              }
              setRelation(item.value);
              setRelationshipPickerVisible(false);
              setError(undefined);
            },
          }))}
        />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    minHeight: sizes.minimumTouchTarget,
    paddingHorizontal: space[12],
  },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: {
    minHeight: 23,
    paddingHorizontal: space[20],
  },
  content: {
    padding: layout.gutter,
    gap: spacing.md,
  },
  select: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notice: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
    borderColor: 'transparent',
  },
  removeNotice: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
    borderColor: 'transparent',
  },
  consent: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: sizes.icon.md,
    height: sizes.icon.md,
    borderWidth: 1,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentCopy: { flex: 1, gap: space[2] },
  removeRow: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  destructiveAction: {
    minHeight: sizes.button.md,
    borderWidth: 1,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: { opacity: 0.5 },
  actions: {
    paddingHorizontal: layout.gutter,
    paddingTop: space[16],
    paddingBottom: space[16],
    gap: space[8],
  },
});
