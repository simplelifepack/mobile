import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
import type { HealthMember, HealthMemberUpdate } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { Select } from '../../../components/primitives/Select';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { BLOOD_GROUPS, ChoiceChips, FormSheet, HealthField } from './HealthForms';

function NoKnownOption({ label, checked, onPress }: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
    >
      <Row align="center" gap="sm">
        <View style={[
          styles.checkbox,
          {
            borderColor: checked ? theme.colors.border.interactive : theme.colors.border.default,
            backgroundColor: checked ? theme.colors.action.primary.default : theme.colors.surface.default,
          },
        ]}>
          {checked ? <Check size={sizes.icon.sm} color={theme.colors.text.onBrand} /> : null}
        </View>
        <AppText variant="body">{label}</AppText>
      </Row>
    </Pressable>
  );
}

export function EditCareProfileSheet({ member, members = [], onClose, onSave }: {
  member: HealthMember;
  members?: HealthMember[];
  onClose: () => void;
  onSave: (payload: HealthMemberUpdate) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [bloodGroup, setBloodGroup] = useState(member.bloodGroup || 'Unknown');
  const [choosingBlood, setChoosingBlood] = useState(false);
  const [noConditions, setNoConditions] = useState(member.conditions?.trim().toLowerCase() === 'no known conditions');
  const [noAllergies, setNoAllergies] = useState(member.allergies?.trim().toLowerCase() === 'no known allergies');
  const [conditions, setConditions] = useState(
    noConditions ? [] : (member.conditions || '').split(',').map(value => value.trim()).filter(Boolean),
  );
  const [conditionDraft, setConditionDraft] = useState('');
  const [allergies, setAllergies] = useState(noAllergies ? '' : member.allergies || '');
  const [doctor, setDoctor] = useState(member.primaryDoctor || '');
  const [hospital, setHospital] = useState(member.preferredHospital || '');
  const [contactName, setContactName] = useState(member.emergencyContactName || '');
  const [contactPhone, setContactPhone] = useState(member.emergencyContactPhone || '');
  const [provider, setProvider] = useState(member.insuranceProvider || '');
  const [policyNumber, setPolicyNumber] = useState(member.insurancePolicyNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const addCondition = () => {
    const value = conditionDraft.trim();
    if (!value) return;
    const next = [...conditions, value];
    if (next.join(', ').length > 2000) {
      setError('Conditions must be no more than 2000 characters.');
      return;
    }
    setConditions(next);
    setConditionDraft('');
    setError(undefined);
  };

  const save = async () => {
    const allConditions = [...conditions, ...(conditionDraft.trim() ? [conditionDraft.trim()] : [])].join(', ');
    if (!noConditions && allConditions.length > 2000) {
      setError('Conditions must be no more than 2000 characters.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        bloodGroup,
        conditions: noConditions ? 'No known conditions' : allConditions,
        allergies: noAllergies ? 'No known allergies' : allergies.trim(),
        primaryDoctor: doctor.trim(),
        ...(hospital.trim() !== (member.preferredHospital || '') ? { preferredHospital: hospital.trim() } : {}),
        emergencyContactName: contactName.trim(),
        emergencyContactPhone: contactPhone.trim(),
        insuranceProvider: provider.trim(),
        insurancePolicyNumber: policyNumber.trim(),
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet title={`Edit ${member.name}'s care profile`} onClose={() => { if (!saving) onClose(); }}>
      <Stack gap="sm">
        <Row align="flex-end" gap="sm">
          <View style={styles.grow}>
            <HealthField label="Conditions" value={conditionDraft} onChangeText={setConditionDraft}
              editable={!noConditions} placeholder="Add condition" maxLength={2000}
              onSubmitEditing={addCondition} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add condition"
            accessibilityState={{ disabled: noConditions || !conditionDraft.trim() }}
            disabled={noConditions || !conditionDraft.trim()}
            onPress={addCondition}
            style={[styles.addButton, { borderColor: theme.colors.border.default }, noConditions && styles.disabled]}
          >
            <Plus size={sizes.icon.md} color={theme.colors.text.primary} />
          </Pressable>
        </Row>
        {!noConditions && conditions.length ? (
          <View style={styles.chipRow}>
            {conditions.map((condition, index) => (
              <Pressable
                key={`${condition}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`Remove condition ${condition}`}
                onPress={() => setConditions(current => current.filter((_, position) => position !== index))}
                style={[styles.chip, { backgroundColor: theme.colors.surface.secondary, borderColor: theme.colors.border.default }]}
              >
                <AppText variant="label">{condition}</AppText>
                <X size={sizes.icon.sm} color={theme.colors.text.secondary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <NoKnownOption label="No known conditions" checked={noConditions} onPress={() => setNoConditions(value => !value)} />
        <Row gap="sm">
          <View style={styles.grow}>
            <HealthField label="Allergies" value={noAllergies ? '' : allergies} onChangeText={setAllergies}
              editable={!noAllergies} placeholder="e.g. penicillin" maxLength={2000} multiline />
          </View>
          <View style={styles.bloodField}>
            <Stack gap="xs">
              <AppText variant="label" color="secondary">Blood</AppText>
              <Select label="Blood group" value={bloodGroup} onPress={() => setChoosingBlood(value => !value)} />
            </Stack>
          </View>
        </Row>
        {choosingBlood ? (
          <ChoiceChips label="Blood group" options={BLOOD_GROUPS} value={bloodGroup} onChange={value => {
            setBloodGroup(value);
            setChoosingBlood(false);
          }} />
        ) : null}
        <NoKnownOption label="No known allergies" checked={noAllergies} onPress={() => setNoAllergies(value => !value)} />
        <HealthField label="Primary doctor" value={doctor} onChangeText={setDoctor} maxLength={160} />
        <HealthField label="Preferred hospital" value={hospital} onChangeText={setHospital} maxLength={160} />
        <AppText variant="label" color="secondary">Emergency contact</AppText>
        {members.filter(item => item.id !== member.id).length ? (
          <View style={styles.chipRow}>
            {members.filter(item => item.id !== member.id).map(item => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name} as emergency contact`}
                onPress={() => {
                  if (contactName !== item.name) setContactPhone('');
                  setContactName(item.name);
                }}
                style={[styles.chip, { backgroundColor: theme.colors.surface.secondary, borderColor: theme.colors.border.default }]}
              >
                <AppText variant="label">{item.name}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Row gap="sm">
          <View style={styles.grow}>
            <HealthField label="Name (relation)" value={contactName} onChangeText={setContactName} maxLength={120} />
          </View>
          <View style={styles.grow}>
            <HealthField label="Phone" value={contactPhone} onChangeText={setContactPhone} maxLength={40} keyboardType="phone-pad" />
          </View>
        </Row>
        <HealthField label="Insurance provider" value={provider} onChangeText={setProvider} maxLength={160} />
        <HealthField label="Policy number" value={policyNumber} onChangeText={setPolicyNumber} maxLength={120} />
        {error ? <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText> : null}
        <Button title={saving ? 'Saving…' : 'Save profile'} disabled={saving} onPress={() => { save(); }} />
      </Stack>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.5 },
  bloodField: { width: 120 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButton: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: sizes.icon.md,
    height: sizes.icon.md,
    borderWidth: 1,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
