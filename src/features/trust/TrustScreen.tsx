import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { KeyRound, UserRound, Users, X } from 'lucide-react-native';
import { trustApi } from '../../api/trust.api';
import type {
  TrustCenterResponse,
  TrustMember,
  TrustMemberPayload,
} from '../../api/types';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { staticColors } from '../../design/tokens/colors';
import { radius } from '../../design/tokens/radius';

const accessTypes: TrustMemberPayload['accessTypeCode'][] = [
  'VIEW_ONLY',
  'FAMILY_MEMBER',
  'EMERGENCY_ACCESS',
];

function permissionsFor(
  accessTypeCode: TrustMemberPayload['accessTypeCode'],
): TrustMemberPayload['permissions'] {
  const full = accessTypeCode === 'FAMILY_MEMBER';
  const emergency = accessTypeCode === 'EMERGENCY_ACCESS';
  return [
    { module: 'DOCUMENTS', canView: true, canDownload: full },
    { module: 'HEALTH', canView: full, canDownload: false },
    {
      module: 'WEALTH',
      canView: full || emergency,
      canDownload: full || emergency,
    },
  ];
}

export function TrustScreen({ familyOnly = false }: { familyOnly?: boolean }) {
  const { theme } = useAppTheme();
  const [data, setData] = useState<TrustCenterResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [formVisible, setFormVisible] = useState(false);
  const [busyId, setBusyId] = useState<string>();
  const [pinMember, setPinMember] = useState<TrustMember>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await trustApi.get());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load family access.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runMemberAction = async (
    member: TrustMember,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setBusyId(member.id);
    setError(undefined);
    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this family member.',
      );
    } finally {
      setBusyId(undefined);
    }
  };

  const removeMember = (member: TrustMember) =>
    Alert.alert(
      'Remove family member?',
      `Remove ${member.name} and revoke their access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            void runMemberAction(
              member,
              () => trustApi.revokeMember(member.id),
              `${member.name} was removed.`,
            ),
        },
      ],
    );

  if (loading && !data) {
    return (
      <Screen>
        <LoadingState fill label="Loading family access…" />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen>
        <Stack gap="md">
          <ErrorState message={error} />
          <Button title="Retry" onPress={load} />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      onRefresh={load}
      floatingAction={
        <FloatingActionButton
          accessibilityLabel="Add family member"
          onPress={() => setFormVisible(true)}
        />
      }
    >
      <Stack gap="md" style={styles.container}>
        <Row align="center" justify="space-between">
          <Stack gap="xs">
            <AppText variant="title">
              {familyOnly ? 'Family' : 'Trust Center'}
            </AppText>
            <AppText variant="caption" color="secondary">
              {familyOnly
                ? `${data?.members.length ?? 0} family members`
                : 'Manage who can access your shared records.'}
            </AppText>
          </Stack>
        </Row>

        {error ? <ErrorState message={error} /> : null}
        {notice ? (
          <Card>
            <AppText variant="caption" color="success">
              {notice}
            </AppText>
          </Card>
        ) : null}

        {!familyOnly && data ? (
          <Card>
            <Row align="center" gap="sm">
              <UserRound size={20} color={theme.colors.text.interactive} />
              <Stack gap="xs" style={styles.memberCopy}>
                <AppText variant="label">{data.owner.name} · Owner</AppText>
                <AppText variant="caption" color="secondary">
                  {data.owner.email}
                </AppText>
              </Stack>
            </Row>
          </Card>
        ) : null}

        <Stack gap="sm">
          <AppText variant="heading">
            {familyOnly ? 'Family members' : 'Family & access'}
          </AppText>
          {data?.members.length ? (
            data.members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                familyOnly={familyOnly}
                busy={busyId === member.id}
                onChangeAccess={accessTypeCode =>
                  void runMemberAction(
                    member,
                    () =>
                      trustApi.updateMember(member.id, { accessTypeCode }),
                    `Access updated for ${member.name}.`,
                  )
                }
                onResend={() =>
                  void runMemberAction(
                    member,
                    () => trustApi.resendInvitation(member.id),
                    `Invitation resent to ${member.name}.`,
                  )
                }
                onResetPin={() => setPinMember(member)}
                onRemove={() => removeMember(member)}
              />
            ))
          ) : (
            <Card>
              <Stack gap="sm" align="center">
                <Users size={24} color={theme.colors.text.secondary} />
                <AppText variant="label">No family members yet</AppText>
                <AppText variant="caption" color="secondary" align="center">
                  Add a family profile and choose its access level.
                </AppText>
                <Button
                  title="Add family member"
                  onPress={() => setFormVisible(true)}
                />
              </Stack>
            </Card>
          )}
        </Stack>

        {!familyOnly && data?.connections.length ? (
          <Stack gap="sm">
            <AppText variant="heading">Connected to</AppText>
            {data.connections.map(connection => (
              <Card key={connection.id}>
                <Row align="center" justify="space-between" gap="sm">
                  <Stack gap="xs" style={styles.memberCopy}>
                    <AppText variant="label">{connection.owner.name}</AppText>
                    <AppText variant="caption" color="secondary">
                      {connection.relationLabel} · {connection.accessType.name}
                    </AppText>
                  </Stack>
                  <Button
                    title="Leave"
                    variant="secondary"
                    onPress={() =>
                      Alert.alert(
                        'Leave shared access?',
                        `You will lose access to ${connection.owner.name}'s Readiness account.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Leave',
                            style: 'destructive',
                            onPress: () => {
                              void trustApi
                                .leaveConnection(connection.id)
                                .then(load)
                                .catch(actionError =>
                                  setError(
                                    actionError instanceof Error
                                      ? actionError.message
                                      : 'Unable to leave shared access.',
                                  ),
                                );
                            },
                          },
                        ],
                      )
                    }
                  />
                </Row>
              </Card>
            ))}
          </Stack>
        ) : null}

        {!familyOnly ? (
          <Button
            title="Refresh"
            variant="secondary"
            onPress={load}
          />
        ) : null}
      </Stack>

      <MemberForm
        visible={formVisible}
        familyOnly={familyOnly}
        onClose={() => setFormVisible(false)}
        onSave={async payload => {
          const add = familyOnly ? trustApi.addFamilyMember : trustApi.addMember;
          await add(payload);
          setFormVisible(false);
          setNotice('Family member added.');
          await load();
        }}
      />
      <PinResetModal
        member={pinMember}
        onClose={() => setPinMember(undefined)}
        onSave={async pin => {
          if (!pinMember) return;
          await trustApi.resetInvitationPin(pinMember.id, pin);
          setNotice(`PIN reset for ${pinMember.name}. Share it separately.`);
          setPinMember(undefined);
          await load();
        }}
      />
    </Screen>
  );
}

function MemberCard({
  member,
  familyOnly,
  busy,
  onChangeAccess,
  onResend,
  onResetPin,
  onRemove,
}: {
  member: TrustMember;
  familyOnly: boolean;
  busy: boolean;
  onChangeAccess: (accessTypeCode: TrustMemberPayload['accessTypeCode']) => void;
  onResend: () => void;
  onResetPin: () => void;
  onRemove: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Card>
      <Stack gap="sm">
        <Row align="center" gap="sm">
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.surface.raised },
            ]}
          >
            <AppText variant="label">
              {member.name.charAt(0).toUpperCase()}
            </AppText>
          </View>
          <Stack gap="xs" style={styles.memberCopy}>
            <AppText variant="label">{member.name}</AppText>
            <AppText variant="caption" color="secondary">
              {member.relationLabel} · {member.email}
            </AppText>
            <AppText variant="caption" color="muted">
              {member.status} · {member.invitationStatus}
            </AppText>
          </Stack>
          {!familyOnly ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${member.name}`}
              disabled={busy}
              onPress={onRemove}
              hitSlop={8}
            >
              <X size={19} color={theme.colors.status.danger.text} />
            </Pressable>
          ) : null}
        </Row>
        <AppText variant="caption" color="secondary">
          {member.dateOfBirth} · {member.bloodGroup}
        </AppText>
        {!familyOnly ? (
          <Stack gap="xs">
            <AppText variant="caption" color="muted">ACCESS LEVEL</AppText>
            <Row gap="xs">
              {accessTypes.map(accessType => (
                <Pressable
                  key={accessType}
                  disabled={busy}
                  onPress={() => onChangeAccess(accessType)}
                  style={({ pressed }) => [
                    styles.accessChoice,
                    {
                      borderColor:
                        member.accessType.code === accessType
                          ? theme.colors.border.interactive
                          : theme.colors.border.default,
                      backgroundColor:
                        member.accessType.code === accessType
                          ? theme.colors.surface.raised
                          : 'transparent',
                      opacity: pressed || busy ? 0.65 : 1,
                    },
                  ]}
                >
                  <AppText variant="caption" align="center">
                    {accessType === 'VIEW_ONLY'
                      ? 'View only'
                      : accessType === 'FAMILY_MEMBER'
                        ? 'Full access'
                        : 'Emergency'}
                  </AppText>
                </Pressable>
              ))}
            </Row>
            {member.status === 'INVITED' ||
            member.invitationStatus === 'EXPIRED' ? (
              <Row gap="xs">
                <Button
                  title="Resend invitation"
                  variant="secondary"
                  disabled={busy}
                  onPress={onResend}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reset PIN for ${member.name}`}
                  disabled={busy}
                  onPress={onResetPin}
                  style={styles.iconButton}
                >
                  <KeyRound size={18} color={theme.colors.text.secondary} />
                </Pressable>
              </Row>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}

function MemberForm({
  visible,
  familyOnly,
  onClose,
  onSave,
}: {
  visible: boolean;
  familyOnly: boolean;
  onClose: () => void;
  onSave: (payload: TrustMemberPayload) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState<TrustMemberPayload['relation']>('PARENT');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<TrustMemberPayload['bloodGroup']>('O+');
  const [accessTypeCode, setAccessTypeCode] = useState<TrustMemberPayload['accessTypeCode']>('VIEW_ONLY');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const close = () => {
    setName('');
    setEmail('');
    setDateOfBirth('');
    setPin('');
    setError(undefined);
    onClose();
  };

  const save = async () => {
    if (!name.trim() || !email.trim() || !dateOfBirth.trim()) {
      setError('Name, email, and date of birth are required.');
      return;
    }
    if (pin && !/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        relation,
        dateOfBirth,
        bloodGroup,
        accessTypeCode,
        ...(pin ? { pin } : {}),
        permissions: permissionsFor(accessTypeCode),
      });
      setName('');
      setEmail('');
      setDateOfBirth('');
      setPin('');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to add this family member.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.surface.canvas }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Add family member</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close}>
              <X size={22} color={theme.colors.text.primary} />
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <FormInput label="Name" value={name} onChangeText={setName} placeholder="Full name" />
            <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
            <FormDateInput label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} />
            <FormInput label="Relation" value={relation} onChangeText={value => setRelation(value.toUpperCase() as TrustMemberPayload['relation'])} placeholder="PARENT" />
            <FormInput label="Blood group" value={bloodGroup} onChangeText={value => setBloodGroup(value.toUpperCase() as TrustMemberPayload['bloodGroup'])} placeholder="O+" />
            {!familyOnly ? (
              <FormInput label="Invitation PIN (optional)" value={pin} onChangeText={setPin} placeholder="6 digits" keyboardType="number-pad" maxLength={6} />
            ) : null}
            <AppText variant="caption" color="secondary">Access level</AppText>
            <Row gap="xs">
              {accessTypes.map(accessType => (
                <Pressable
                  key={accessType}
                  onPress={() => setAccessTypeCode(accessType)}
                  style={[
                    styles.accessChoice,
                    {
                      borderColor: accessTypeCode === accessType ? theme.colors.border.interactive : theme.colors.border.default,
                      backgroundColor: accessTypeCode === accessType ? theme.colors.surface.raised : 'transparent',
                    },
                  ]}
                >
                  <AppText variant="caption" align="center">
                    {accessType === 'VIEW_ONLY' ? 'View only' : accessType === 'FAMILY_MEMBER' ? 'Full access' : 'Emergency'}
                  </AppText>
                </Pressable>
              ))}
            </Row>
            {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
            <Button
              title={saving ? 'Saving…' : 'Add member'}
              disabled={saving}
              onPress={() => void save()}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PinResetModal({
  member,
  onClose,
  onSave,
}: {
  member?: TrustMember;
  onClose: () => void;
  onSave: (pin: string) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) {
      setPin('');
      setError(undefined);
    }
  }, [member]);

  const save = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave(pin);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to reset PIN.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={Boolean(member)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalPanel,
            { backgroundColor: theme.colors.surface.canvas },
          ]}
        >
          <AppText variant="heading">Reset invitation PIN</AppText>
          <AppText variant="caption" color="secondary">
            Set a new six-digit PIN for {member?.name} and share it separately.
          </AppText>
          <FormInput
            label="New PIN"
            value={pin}
            onChangeText={value => setPin(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6 digits"
            keyboardType="number-pad"
            maxLength={6}
          />
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <Row gap="sm">
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button
              title={saving ? 'Saving…' : 'Reset PIN'}
              disabled={saving}
              onPress={() => void save()}
            />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

function FormDateInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="caption" color="secondary">{label}</AppText>
      <DatePickerInput
        value={value}
        onChangeText={onChangeText}
        placeholder="YYYY-MM-DD"
        maximumDate={new Date()}
        style={[
          styles.input,
          { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
        ]}
      />
    </Stack>
  );
}

function FormInput({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="caption" color="secondary">{label}</AppText>
      <TextInput
        {...props}
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
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 20, paddingBottom: 32 },
  memberCopy: { flex: 1, minWidth: 0 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessChoice: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: radius.surface,
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: staticColors.scrim,
  },
  modalPanel: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    padding: 20,
    gap: 16,
  },
  formContent: { gap: 12, paddingBottom: 24 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
});
