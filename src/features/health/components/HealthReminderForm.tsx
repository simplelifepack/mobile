import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { BellRing, ChevronLeft, Info, UserRound } from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { textRoles } from '../../../design/tokens/typography';
import { REMINDER_FREQUENCIES, REMINDER_TYPES, toIsoDate } from './HealthForms';

type ReminderType = typeof REMINDER_TYPES[number]['value'];
type ReminderFrequency = typeof REMINDER_FREQUENCIES[number]['value'];
type ReminderPayload = { title: string; type: ReminderType; dueDate: string; frequency: ReminderFrequency; time: string };

export function HealthReminderForm({ memberName, onClose, onSave }: {
  memberName: string;
  onClose: () => void;
  onSave: (payload: ReminderPayload) => Promise<string | undefined>;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [frequency, setFrequency] = useState<ReminderFrequency | ''>('');
  const [saved, setSaved] = useState<ReminderPayload>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [scheduleWarning, setScheduleWarning] = useState<string>();
  const submitting = useRef(false);
  const dueIso = toIsoDate(dueDate);
  const displayDate = dueIso
    ? new Date(`${dueIso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : dueDate;
  const inputStyle = [styles.input, { backgroundColor: colors.surface.inset, borderColor: colors.border.default, color: colors.text.primary }];

  const save = async () => {
    if (submitting.current || saved) return;
    if (!title.trim() || !type || !dueDate.trim() || !frequency) {
      setError('Reminder type, title, start date and repeat are required.');
      return;
    }
    if (!dueIso) {
      setError('Enter a valid start date.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Enter the time in 24-hour format, for example 09:00.');
      return;
    }
    const [year, month, day] = dueIso.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const start = new Date(year!, month! - 1, day!, hour!, minute!);
    if (start.getHours() !== hour || start.getMinutes() !== minute) {
      setError('That time does not exist on the selected date. Choose another time.');
      return;
    }
    if (frequency === 'once' && start.getTime() <= Date.now()) {
      setError('Choose a future date and time for a one-time reminder.');
      return;
    }
    const payload = { title: title.trim(), type, dueDate: dueIso, frequency, time };
    submitting.current = true;
    setSaving(true);
    setError(undefined);
    try {
      const warning = await onSave(payload);
      setScheduleWarning(warning);
      setSaved(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save reminder.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const unavailable = (label: string, detail = 'Unavailable') => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <View accessible accessibilityLabel={`${label}: ${detail}`} accessibilityState={{ disabled: true }} style={[inputStyle, styles.disabled]}>
        <AppText variant="bodySm" color="muted">{detail}</AppText>
      </View>
    </View>
  );
  const choices = <T extends string>(label: string, options: ReadonlyArray<{ value: T; label: string }>, selected: T | '', change: (value: T) => void, extra?: React.ReactNode) => (
    <View style={styles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <View style={styles.chips}>
        {options.map(option => (
          <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${label}: ${option.label}`}
            accessibilityState={{ selected: selected === option.value, disabled: saving }} disabled={saving}
            onPress={() => change(option.value)}
            style={[styles.chip, { backgroundColor: selected === option.value ? colors.action.primary.default : colors.surface.brandTint, borderColor: selected === option.value ? colors.action.primary.default : colors.border.default }]}>
            <AppText variant="caption" style={{ color: selected === option.value ? colors.text.onBrand : colors.text.interactive }}>{option.label}</AppText>
          </Pressable>
        ))}
        {extra}
      </View>
    </View>
  );
  const typeOptions = REMINDER_TYPES.map(option => ({
    ...option,
    label: option.value === 'medicine' ? 'Medicine' : option.value === 'other' ? 'Other' : option.label,
  }));
  const frequencyLabel = REMINDER_FREQUENCIES.find(option => option.value === saved?.frequency)?.label;
  const typeLabel = typeOptions.find(option => option.value === saved?.type)?.label;

  return (
    <Modal visible animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface.canvas }]}>
          <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Close reminder" disabled={saving} onPress={onClose} style={styles.back}>
                <ChevronLeft size={sizes.icon.md} color={colors.icon.primary} />
              </Pressable>
              <AppText variant="overviewTitle">{saved ? 'Reminder saved' : 'Create reminder'}</AppText>
            </View>
            <View style={styles.member}>
              <UserRound size={sizes.icon.sm} color={colors.icon.interactive} />
              <AppText variant="caption" numberOfLines={1} style={[styles.memberName, { color: colors.text.interactive }]}>{memberName}</AppText>
              <AppText variant="caption" color="muted" style={styles.vault}>Private health vault</AppText>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {saved ? (
                <>
                  <View style={styles.intro}>
                    <View style={[styles.icon, { backgroundColor: colors.surface.brandTint }]}><BellRing size={sizes.icon.lg} color={colors.icon.interactive} /></View>
                    <AppText variant="heading" align="center">Reminder saved</AppText>
                    <AppText variant="bodySm" color="secondary" align="center">The reminder was saved to {memberName}&apos;s health profile.</AppText>
                  </View>
                  <View style={[styles.summary, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
                    <AppText variant="compactLabel">{saved.title}</AppText>
                    {[
                      ['Type', typeLabel ?? saved.type],
                      ['Starts on', displayDate],
                      ['Time', `${saved.time} local`],
                      ['Repeat', frequencyLabel ?? saved.frequency],
                      ['For', memberName],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.summaryRow}>
                        <AppText variant="caption" color="secondary" style={styles.summaryLabel}>{label}</AppText>
                        <AppText variant="bodySm" style={styles.flex}>{value}</AppText>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
                    <Info size={sizes.icon.sm} color={colors.icon.secondary} />
                    <AppText variant="caption" color={scheduleWarning ? 'danger' : 'secondary'} style={styles.flex}>{scheduleWarning ?? 'The time is stored only on this device. Repeating alerts are scheduled ahead and replenished when the app syncs; notification delivery depends on device settings.'}</AppText>
                  </View>
                  <Button title="Edit reminder (unavailable)" variant="secondary" disabled />
                </>
              ) : (
                <>
                  {choices('Reminder type', typeOptions, type, setType,
                    <View accessible accessibilityLabel="Reminder type: Reading unavailable" accessibilityState={{ disabled: true }}
                      style={[styles.chip, styles.disabled, { backgroundColor: colors.surface.brandTint, borderColor: colors.border.default }]}>
                      <AppText variant="caption" color="muted">Reading (unavailable)</AppText>
                    </View>)}
                  {type === 'medicine' ? unavailable('Linked medicine') : null}
                  <View style={styles.field}>
                    <AppText variant="caption" color="secondary">Reminder title</AppText>
                    <TextInput accessibilityLabel="Reminder title" value={title} onChangeText={setTitle} editable={!saving}
                      placeholder="e.g. Cardiology follow-up" placeholderTextColor={colors.text.tertiary} maxLength={180} style={inputStyle} />
                  </View>
                  <View style={styles.dateRow}>
                    <View style={styles.flex}>
                      <AppText variant="caption" color="secondary">Starts on</AppText>
                      <DatePickerInput value={dueDate} onChangeText={setDueDate} displayValue={displayDate} dateFormat="us" disabled={saving} style={inputStyle} />
                    </View>
                    <View style={[styles.flex, styles.field]}>
                      <AppText variant="caption" color="secondary">Time · local (24-hour)</AppText>
                      <TextInput accessibilityLabel="Reminder time" value={time} onChangeText={setTime} editable={!saving} placeholder="HH:MM"
                        placeholderTextColor={colors.text.tertiary} maxLength={5} style={inputStyle} />
                    </View>
                  </View>
                  {choices('Repeat', REMINDER_FREQUENCIES, frequency, setFrequency)}
                  {unavailable('Ends on')}
                  {unavailable('Notes (optional)')}
                  <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
                    <Info size={sizes.icon.sm} color={colors.icon.secondary} />
                    <AppText variant="caption" color="secondary" style={styles.flex}>The chosen time is stored on this device only. Notifications depend on device settings. Repeating alerts are scheduled ahead and replenished when the app syncs. End date and notes are unavailable.</AppText>
                  </View>
                  {error ? <AppText color="danger">{error}</AppText> : null}
                </>
              )}
            </ScrollView>
            <View style={styles.footer}>
              {saved ? <Button title="Done" onPress={onClose} /> : (
                <>
                  <Button title={saving ? 'Saving…' : 'Save reminder'} disabled={saving} onPress={() => { save(); }} />
                  <Button title="Cancel" variant="secondary" disabled={saving} onPress={onClose} />
                </>
              )}
            </View>
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
  content: { padding: 16, gap: 16 },
  field: { gap: 4 },
  dateRow: { flexDirection: 'row', gap: 12 },
  input: { ...textRoles.bodySm, minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8 },
  disabled: { justifyContent: 'center', opacity: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  intro: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  icon: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  summary: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryLabel: { width: 110 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 },
});
