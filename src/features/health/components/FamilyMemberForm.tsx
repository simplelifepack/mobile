import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ChevronDown, ChevronLeft, Info, UserRound } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import type { HealthMember, HealthMemberCreate } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { textRoles } from '../../../design/tokens/typography';
import { BLOOD_GROUPS, RELATIONS, toIsoDate } from './HealthForms';
import { isDefaultProfile } from './ManageFamily';

export function FamilyMemberForm({ member, managerName, initialName = '', onClose, onSave }: {
  member?: HealthMember;
  managerName?: string;
  initialName?: string;
  onClose: () => void;
  onSave: (payload: HealthMemberCreate) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const defaultProfile = member ? isDefaultProfile(member) : false;
  const knownRelation = RELATIONS.find(item => item.value.toLowerCase() === member?.relation.toLowerCase());
  const [name, setName] = useState(member?.name ?? initialName);
  const [relation, setRelation] = useState(knownRelation?.value ?? (member && !defaultProfile ? 'Other' : ''));
  const [customRelation, setCustomRelation] = useState(member && !defaultProfile && (!knownRelation || knownRelation.value === 'Other') ? member.relation : '');
  const [birth, setBirth] = useState(member?.dateOfBirth?.slice(0, 10) ?? '');
  const [blood, setBlood] = useState(member?.bloodGroup || 'Unknown');
  const [allergies, setAllergies] = useState(member?.allergies ?? '');
  const [conditions, setConditions] = useState(member?.conditions ?? '');
  const [contactName, setContactName] = useState(member?.emergencyContactName ?? '');
  const [contactPhone, setContactPhone] = useState(member?.emergencyContactPhone ?? '');
  const [openChoice, setOpenChoice] = useState<'relation' | 'blood'>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  const date = birth ? toIsoDate(birth) : null;
  const displayDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : birth;
  const inputStyle = [styles.input, { backgroundColor: colors.surface.inset, borderColor: colors.border.default, color: colors.text.primary }];

  const save = async () => {
    if (submitting.current) return;
    const resolvedRelation = defaultProfile ? member!.relation : relation === 'Other' ? customRelation.trim() : relation;
    if (!name.trim() || !resolvedRelation) {
      setError('Name and relationship are required.');
      return;
    }
    if (birth && (!date || new Date(`${date}T00:00:00`).getTime() > Date.now())) {
      setError('Enter a valid date of birth that is not in the future.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        name: name.trim(), relation: resolvedRelation, dateOfBirth: date,
        bloodGroup: blood === 'Unknown' ? null : blood,
        allergies: allergies.trim() || null, conditions: conditions.trim() || null,
        emergencyContactName: contactName.trim() || null, emergencyContactPhone: contactPhone.trim() || null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save profile.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };
  const field = (label: string, value: string, onChangeText: (text: string) => void, options?: { placeholder?: string; maxLength?: number; multiline?: boolean; phone?: boolean }) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} editable={!saving}
        placeholder={options?.placeholder} placeholderTextColor={colors.text.tertiary} maxLength={options?.maxLength}
        multiline={options?.multiline} keyboardType={options?.phone ? 'phone-pad' : 'default'}
        style={[inputStyle, options?.multiline && styles.multiline]} />
    </View>
  );
  const unavailable = (label: string) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <View accessible accessibilityLabel={`${label}: Unavailable`} accessibilityState={{ disabled: true }} style={[inputStyle, styles.disabled]}>
        <AppText variant="bodySm" color="muted">Unavailable</AppText>
      </View>
    </View>
  );
  const selector = (label: string, value: string, kind: 'relation' | 'blood', options: typeof RELATIONS, change: (value: string) => void, disabled = false) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: openChoice === kind, disabled: saving || disabled }}
        disabled={saving || disabled} onPress={() => setOpenChoice(openChoice === kind ? undefined : kind)}
        style={[inputStyle, styles.select, disabled && styles.disabled]}>
        <AppText variant="bodySm" numberOfLines={1} style={styles.flex}>{value}</AppText>
        {!disabled ? <ChevronDown size={sizes.icon.sm} color={colors.icon.secondary} /> : null}
      </Pressable>
      {openChoice === kind && !disabled ? (
        <View style={styles.choices}>
          {options.map(option => (
            <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ selected: value === option.label, disabled: saving }} disabled={saving}
              onPress={() => { change(option.value); setOpenChoice(undefined); }}
              style={[styles.choice, { borderColor: colors.border.default, backgroundColor: colors.surface.secondary }]}>
              <AppText variant="caption">{option.label}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface.canvas }]}>
          <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={saving} onPress={onClose} style={styles.back}>
                <ChevronLeft size={sizes.icon.md} color={colors.icon.primary} />
              </Pressable>
              <AppText variant="overviewTitle">{member ? 'Edit family member' : 'Add family member'}</AppText>
            </View>
            <View style={styles.member}>
              <UserRound size={sizes.icon.sm} color={colors.icon.interactive} />
              <AppText variant="caption" numberOfLines={1} style={[styles.memberName, { color: colors.text.interactive }]}>{member ? `${member.name} · ${member.relation}` : managerName ? `${managerName} · Managing family` : 'Managing family'}</AppText>
              <AppText variant="caption" color="muted" style={styles.vault}>Private health vault</AppText>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {field('Full name', name, setName, { placeholder: 'Enter member’s full name', maxLength: 120 })}
              <View style={styles.row}>
                <View style={styles.flex}>{selector('Relationship', defaultProfile ? member!.relation : relation || 'Select', 'relation', RELATIONS, setRelation, defaultProfile)}</View>
                <View style={styles.flex}>
                  <View style={styles.field}>
                    <AppText variant="caption" color="secondary">Date of birth</AppText>
                    <DatePickerInput value={birth} onChangeText={setBirth} displayValue={displayDate} placeholder="DD MMM YYYY"
                      dateFormat="iso" maximumDate={new Date()} disabled={saving} style={inputStyle} />
                  </View>
                </View>
              </View>
              {relation === 'Other' && !defaultProfile ? field('Custom relationship', customRelation, setCustomRelation, { maxLength: 80 }) : null}
              {defaultProfile ? <AppText variant="caption" color="secondary">The default profile relationship cannot be changed.</AppText> : null}
              <View style={styles.row}>
                <View style={styles.flex}>{unavailable('Sex')}</View>
                <View style={styles.flex}>{selector('Blood group', blood === 'Unknown' ? 'Not known' : blood, 'blood', BLOOD_GROUPS, setBlood)}</View>
              </View>
              {field('Allergies', allergies, setAllergies, { placeholder: 'Add known allergies', maxLength: 2000, multiline: true })}
              {field('Medical information', conditions, setConditions, { placeholder: 'Add conditions or care notes', maxLength: 2000, multiline: true })}
              <AppText variant="compactLabel">Emergency contact</AppText>
              <View style={styles.row}>
                <View style={styles.flex}>{field('Name', contactName, setContactName, { maxLength: 120 })}</View>
                <View style={styles.flex}>{unavailable('Relationship')}</View>
              </View>
              {field('Phone number', contactPhone, setContactPhone, { maxLength: 40, phone: true })}
              <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
                <Info size={sizes.icon.sm} color={colors.icon.secondary} />
                <AppText variant="caption" color="secondary" style={styles.flex}>Only add information you have permission to store. Medical details can be updated later.</AppText>
              </View>
              {error ? <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText> : null}
              <View style={styles.buttons}>
                <Button title={saving ? 'Saving…' : member ? 'Save' : 'Create profile'} disabled={saving} onPress={() => { save(); }} />
                <Button title="Cancel" variant="secondary" disabled={saving} onPress={onClose} />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  back: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40 },
  memberName: { flexShrink: 1 },
  vault: { flex: 1, textAlign: 'right' },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  field: { gap: 4 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  input: { ...textRoles.bodySm, minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8 },
  multiline: { minHeight: 56, textAlignVertical: 'top' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { justifyContent: 'center', opacity: 0.6 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  buttons: { gap: 8 },
});
