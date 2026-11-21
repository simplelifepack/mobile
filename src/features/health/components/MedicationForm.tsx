import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ChevronLeft, Info, UserRound } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { healthApi, type MealTiming, type MedicationTime } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { textRoles } from '../../../design/tokens/typography';
import { toIsoDate } from './HealthForms';

const times: Array<{ value: MedicationTime; label: string }> = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'night', label: 'Night' },
];
const meals: Array<{ value: MealTiming; label: string }> = [
  { value: 'before_food', label: 'Before food' },
  { value: 'after_food', label: 'After food' },
  { value: 'with_food', label: 'With food' },
  { value: 'any_time', label: 'Any time' },
];

export function MedicationForm({ memberId, memberName, onClose, onCreated }: {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState<MedicationTime>('morning');
  const [meal, setMeal] = useState<MealTiming>('after_food');
  const [runsOutAt, setRunsOutAt] = useState('');
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctor, setDoctor] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string>();
  const inputStyle = [styles.input, { backgroundColor: colors.surface.inset, borderColor: colors.border.default, color: colors.text.primary }];
  const refillDate = toIsoDate(runsOutAt);
  const displayDate = refillDate
    ? new Date(`${refillDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : runsOutAt;

  const save = async () => {
    if (submitting.current || saved) return;
    if (!name.trim() || !dose.trim()) {
      setError('Medicine name and dose are required.');
      return;
    }
    if (runsOutAt && !refillDate) {
      setError('Enter a valid refill date.');
      return;
    }
    const courseStart = toIsoDate(startDate);
    const courseEnd = toIsoDate(endDate);
    if ((startDate && !courseStart) || (endDate && !courseEnd)) {
      setError('Enter valid start and end dates.');
      return;
    }
    if (courseStart && courseEnd && courseStart > courseEnd) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setSaving(true);
    submitting.current = true;
    setError(undefined);
    try {
      await healthApi.createMedication(memberId, {
        name: name.trim(), dose: dose.trim(), whenToTake: [time], mealTiming: meal, repeatRunsOut: refillDate,
        route: route.trim() || undefined,
        frequency: frequency.trim() || undefined,
        instructions: instructions.trim() || undefined,
        courseStartDate: courseStart ?? undefined,
        courseEndDate: courseEnd ?? undefined,
        prescribingDoctor: doctor.trim() || undefined,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add medicine.');
      setSaving(false);
      submitting.current = false;
      return;
    }
    setSaved(true);
    try {
      await onCreated();
      onClose();
    } catch (refreshError) {
      setError(`Medicine saved, but Health could not be refreshed: ${refreshError instanceof Error ? refreshError.message : 'Please refresh.'}`);
    } finally {
      setSaving(false);
      submitting.current = false;
    }
  };

  const textField = (label: string, value: string, onChange: (next: string) => void, maxLength: number, multiline = false) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} editable={!saving && !saved}
        maxLength={maxLength} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.text.tertiary} style={[inputStyle, multiline && styles.multiline]} />
    </View>
  );
  const dateField = (label: string, value: string, onChange: (next: string) => void) => {
    const iso = toIsoDate(value);
    return (
      <View style={styles.field}>
        <AppText variant="caption" color="secondary">{label}</AppText>
        <DatePickerInput value={value} displayValue={iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : value}
          onChangeText={onChange} dateFormat="us" disabled={saving || saved} style={inputStyle} />
      </View>
    );
  };
  const unavailable = (label: string) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <View accessible accessibilityLabel={`${label}: unavailable until backend support is added`}
        accessibilityState={{ disabled: true }} style={[inputStyle, styles.unavailable]}>
        <AppText variant="bodySm" color="muted">Unavailable</AppText>
      </View>
    </View>
  );
  const choices = <T extends string>(label: string, values: Array<{ value: T; label: string }>, selected: T, onChange: (value: T) => void) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <View style={styles.choices}>
        {values.map(option => (
          <Pressable key={option.value} accessibilityRole="button"
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected: selected === option.value, disabled: saving || saved }}
            disabled={saving || saved} onPress={() => onChange(option.value)}
            style={[styles.chip, {
              backgroundColor: selected === option.value ? colors.action.primary.default : colors.surface.brandTint,
              borderColor: selected === option.value ? colors.action.primary.default : colors.border.default,
            }]}>
            <AppText variant="caption" style={{ color: selected === option.value ? colors.text.onBrand : colors.text.interactive }}>
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </View>
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
            <AppText variant="overviewTitle">Add medicine</AppText>
          </View>
          <View style={styles.member}>
            <UserRound size={sizes.icon.sm} color={colors.icon.interactive} />
            <AppText variant="caption" numberOfLines={1} style={[styles.memberName, { color: colors.text.interactive }]}>{memberName}</AppText>
            <AppText variant="caption" color="muted" style={styles.vault}>Private health vault</AppText>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.field}>
              <AppText variant="caption" color="secondary">Medicine name &amp; strength</AppText>
              <TextInput accessibilityLabel="Medicine name & strength" value={name} onChangeText={setName}
                editable={!saving && !saved} maxLength={180} placeholder="Enter medicine name and strength"
                placeholderTextColor={colors.text.tertiary} style={inputStyle} />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, styles.flex]}>
                <AppText variant="caption" color="secondary">Dose</AppText>
                <TextInput accessibilityLabel="Dose" value={dose} onChangeText={setDose}
                  editable={!saving && !saved} maxLength={120} placeholder="Enter dose"
                  placeholderTextColor={colors.text.tertiary} style={inputStyle} />
              </View>
              <View style={styles.flex}>{textField('Route', route, setRoute, 60)}</View>
            </View>
            {textField('Frequency', frequency, setFrequency, 160)}
            {textField('Instructions', instructions, setInstructions, 500, true)}
            <View style={styles.row}>
              <View style={styles.flex}>{dateField('Start date', startDate, setStartDate)}</View>
              <View style={styles.flex}>{dateField('End date', endDate, setEndDate)}</View>
            </View>
            {textField('Prescribing doctor', doctor, setDoctor, 120)}
            {unavailable('Linked prescription')}
            {unavailable('Scheduled reminder')}
            <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
              <Info size={sizes.icon.sm} color={colors.icon.secondary} />
              <AppText variant="caption" color="secondary" style={styles.flex}>
                Linking a prescription or scheduling a reminder is not available here yet. Time of day and meal timing below do not create a reminder.
              </AppText>
            </View>
            {choices('When to take it', times, time, setTime)}
            {choices('With meals', meals, meal, setMeal)}
            <View style={styles.field}>
              <AppText variant="caption" color="secondary">Repeat runs out (optional)</AppText>
              <DatePickerInput value={runsOutAt} displayValue={displayDate} onChangeText={setRunsOutAt}
                dateFormat="us" disabled={saving || saved} style={inputStyle} />
            </View>
            <AppText variant="caption" color="muted">Enter exactly as prescribed. Medicine name and dose are required.</AppText>
            {error ? <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">{error}</AppText> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button title={saving ? 'Saving…' : saved ? 'Saved' : 'Save'} disabled={saving || saved} onPress={() => { save(); }} />
            <Button title={saved ? 'Close' : 'Cancel'} variant="secondary" disabled={saving} onPress={onClose} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  back: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40 },
  memberName: { flexShrink: 1 },
  vault: { flex: 1, textAlign: 'right' },
  content: { padding: 16, gap: 16 },
  field: { gap: 4 },
  input: { ...textRoles.bodySm, minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8 },
  unavailable: { justifyContent: 'center' },
  multiline: { minHeight: 72 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 },
});
