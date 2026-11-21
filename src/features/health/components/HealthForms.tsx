import React,{ useState } from 'react';
import {
KeyboardAvoidingView,
Modal,
Platform,
Pressable,
ScrollView,
StyleSheet,
TextInput,
View
} from 'react-native';

import {
ChevronDown,
ChevronLeft,
Info,
UserRound,
X
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


import { healthApi } from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { styles } from '../healthStyles';
import { sizes } from '../../../design/tokens/sizes';
import { radius } from '../../../design/tokens/radius';
import { textRoles } from '../../../design/tokens/typography';

export const COMMON_TESTS = [
  { label: 'HbA1c', unit: '%' },
  { label: 'LDL Cholesterol', unit: 'mg/dL' },
  { label: 'HDL Cholesterol', unit: 'mg/dL' },
  { label: 'Triglycerides', unit: 'mg/dL' },
  { label: 'Vitamin D', unit: 'ng/mL' },
  { label: 'Vitamin B12', unit: 'pg/mL' },
  { label: 'TSH', unit: 'mIU/L' },
  { label: 'Haemoglobin', unit: 'g/dL' },
  { label: 'SGPT', unit: 'U/L' },
  { label: 'Blood Pressure', unit: 'mmHg' },
  { label: 'Weight', unit: 'kg' },
];

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function formatUsDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export function HealthReadingForm({
  memberId,
  memberName,
  initialMeasurement,
  onClose,
  onCreated,
}: {
  memberId: string;
  memberName: string;
  initialMeasurement?: import('../../../api/health.api').HealthMeasurement;
  onClose: () => void;
  onCreated: (created: import('../../../api/health.api').HealthMeasurement) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState(initialMeasurement?.displayName ?? 'HbA1c');
  const [value, setValue] = useState(initialMeasurement ? String(initialMeasurement.value) : '');
  const [secondaryValue, setSecondaryValue] = useState(initialMeasurement?.secondaryValue != null ? String(initialMeasurement.secondaryValue) : '');
  const [unit, setUnit] = useState(initialMeasurement?.unit ?? '%');
  const [measuredAt, setMeasuredAt] = useState(formatUsDate(new Date()));
  const [time, setTime] = useState(currentTime());
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [rangeLow, setRangeLow] = useState('');
  const [rangeHigh, setRangeHigh] = useState('');
  const [showRange, setShowRange] = useState(false);
  const [customTest, setCustomTest] = useState(false);
  const [choosingTest, setChoosingTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const isPressure = initialMeasurement
    ? initialMeasurement.metricKey === 'blood_pressure' || initialMeasurement.displayName.toLowerCase() === 'blood pressure'
    : name.toLowerCase() === 'blood pressure';
  const hasSecondary = isPressure || initialMeasurement?.secondaryValue != null;
  const measuredDate = toIsoDate(measuredAt);
  const displayDate = measuredDate
    ? new Date(`${measuredDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : measuredAt;

  const save = async () => {
    const numericValue = Number(value);
    if (!name.trim() || !value.trim() || !Number.isFinite(numericValue)) {
      setError('Enter a test name and a valid numeric value.');
      return;
    }
    if (!unit.trim()) {
      setError('Enter the unit shown on your report.');
      return;
    }
    if (secondaryValue.trim() && !Number.isFinite(Number(secondaryValue))) {
      setError('Enter a valid secondary value.');
      return;
    }
    const measuredIso = toIsoDate(measuredAt);
    if (!measuredIso) {
      setError('Enter the date as MM/DD/YYYY.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      setError('Enter the time as HH:MM, for example 08:30.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const low = rangeLow.trim() ? Number(rangeLow) : undefined;
      const high = rangeHigh.trim() ? Number(rangeHigh) : undefined;
      if ((low !== undefined && !Number.isFinite(low)) || (high !== undefined && !Number.isFinite(high)) ||
        (low !== undefined && high !== undefined && low > high)) {
        setShowRange(true);
        setError('Enter a valid reference range.');
        return;
      }
      const created = await healthApi.createMeasurement(memberId, {
        metricKey: initialMeasurement?.metricKey ?? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        displayName: name.trim(),
        originalName: name.trim(),
        value: numericValue,
        secondaryValue: secondaryValue.trim() ? Number(secondaryValue) : undefined,
        unit: unit.trim(),
        context: initialMeasurement?.context,
        bodySite: initialMeasurement?.bodySite,
        referenceMin: low,
        referenceMax: high,
        measuredAt: new Date(`${measuredIso}T${time.trim()}:00`).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        source: source.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      await onCreated(created);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save this reading.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaProvider>
      <SafeAreaView style={[readingFormStyles.screen, { backgroundColor: theme.colors.surface.canvas }]}>
        <KeyboardAvoidingView style={readingFormStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={readingFormStyles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={saving} onPress={onClose} style={readingFormStyles.back}>
              <ChevronLeft size={sizes.icon.md} color={theme.colors.icon.primary} />
            </Pressable>
            <AppText variant="overviewTitle">Log a reading</AppText>
          </View>
          <View style={readingFormStyles.member}>
            <UserRound size={sizes.icon.sm} color={theme.colors.icon.interactive} />
            <AppText variant="caption" numberOfLines={1} style={[readingFormStyles.memberName, { color: theme.colors.text.interactive }]}>{memberName}</AppText>
            <AppText variant="caption" color="muted" style={readingFormStyles.vault}>Private health vault</AppText>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={readingFormStyles.content}>
            <AppText variant="bodySm" color="secondary">Add a value from your home device or report.</AppText>
            <View style={readingFormStyles.field}>
              <AppText variant="caption" color="secondary">Reading type</AppText>
              {initialMeasurement ? (
                <View style={[readingFormStyles.input, readingFormStyles.selectedTest, { backgroundColor: theme.colors.surface.inset, borderColor: theme.colors.border.default }]}>
                  <AppText variant="bodySm">{name}</AppText>
                </View>
              ) : (
                <Pressable accessibilityRole="button" accessibilityLabel="Choose reading type" accessibilityState={{ expanded: choosingTest }}
                  onPress={() => setChoosingTest(!choosingTest)}
                  style={[readingFormStyles.input, readingFormStyles.selectedTest, { backgroundColor: theme.colors.surface.inset, borderColor: theme.colors.border.default }]}>
                  <AppText variant="bodySm" style={readingFormStyles.flex}>{customTest ? 'Custom test' : name}</AppText>
                  <ChevronDown size={sizes.icon.sm} color={theme.colors.icon.secondary} />
                </Pressable>
              )}
            </View>
            {!initialMeasurement && choosingTest ? <View style={readingFormStyles.choices}>
          {COMMON_TESTS.map(test => {
            const active = !customTest && name === test.label;
            return (
              <Pressable
                key={test.label}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setName(test.label);
                  setUnit(test.unit);
                  setCustomTest(false);
                  setSecondaryValue('');
                  setChoosingTest(false);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? theme.colors.border.interactive : theme.colors.border.default,
                    backgroundColor: active ? theme.colors.surface.raised : theme.colors.surface.canvas,
                  },
                ]}
              >
                <AppText variant="label" color={active ? 'primary' : 'secondary'}>{test.label}</AppText>
              </Pressable>
            );
          })}
          <Pressable
        accessibilityRole="button"
        onPress={() => {
          setCustomTest(true);
          setName('');
          setUnit('');
          setSecondaryValue('');
          setChoosingTest(false);
        }}
        style={[styles.chip, { borderColor: theme.colors.border.default }]}
      ><AppText variant="label">Custom test</AppText></Pressable>
            </View> : null}
      {customTest ? (
        <ReadingField label="Test name" value={name} onChangeText={setName} placeholder="Enter test name" />
      ) : null}
      <View style={readingFormStyles.row}>
        <View style={readingFormStyles.flex}>
          <ReadingField
            label={isPressure ? `Systolic · ${unit}` : unit ? `Value · ${unit}` : 'Value'}
            value={value}
            onChangeText={setValue}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
        {hasSecondary ? <View style={readingFormStyles.flex}>
          <ReadingField label={`${isPressure ? 'Diastolic' : 'Secondary value'} · ${unit}`} value={secondaryValue} onChangeText={setSecondaryValue} placeholder="Optional" keyboardType="decimal-pad" />
        </View> : null}
      </View>
      <View style={readingFormStyles.row}>
        <View style={[readingFormStyles.field, readingFormStyles.flex]}>
          <AppText variant="caption" color="secondary">Date</AppText>
          <DatePickerInput value={measuredAt} displayValue={displayDate} onChangeText={setMeasuredAt} dateFormat="us" clearable={false} maximumDate={new Date()}
            style={[readingFormStyles.input, { backgroundColor: theme.colors.surface.inset, borderColor: theme.colors.border.default }]} />
        </View>
        <View style={readingFormStyles.flex}>
          <ReadingField label="Time (24h)" value={time} onChangeText={setTime} placeholder="HH:MM" keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </View>
      {customTest ? (
        <ReadingField label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. mg/dL" />
      ) : null}
      <ReadingField label="Source (optional)" value={source} onChangeText={setSource} placeholder="e.g. Home monitor, Apollo Lab" maxLength={120} />
      <ReadingField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Anything worth remembering" multiline textAlignVertical="top" style={readingFormStyles.notes} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showRange }}
        onPress={() => setShowRange(!showRange)} style={readingFormStyles.rangeToggle}>
        <AppText variant="caption" style={{ color: theme.colors.text.interactive }}>
          {showRange ? 'Hide reference range' : 'Add reference range (optional)'}
        </AppText>
      </Pressable>
      {showRange ? (
      <View style={readingFormStyles.row}>
        <View style={readingFormStyles.flex}>
          <ReadingField label="Range low (optional)" value={rangeLow} onChangeText={setRangeLow} placeholder="As printed" keyboardType="decimal-pad" />
        </View>
        <View style={readingFormStyles.flex}>
          <ReadingField label="Range high (optional)" value={rangeHigh} onChangeText={setRangeHigh} placeholder="As printed" keyboardType="decimal-pad" />
        </View>
      </View>
      ) : null}
      <View style={[readingFormStyles.notice, { backgroundColor: theme.colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={theme.colors.icon.secondary} />
        <AppText variant="caption" color="secondary" style={readingFormStyles.flex}>
          Check the units{hasSecondary ? ' and both values' : ''} before saving. This entry will be added to {memberName}&apos;s reading history.
        </AppText>
      </View>
          </ScrollView>
          <View style={readingFormStyles.footer}>
            {error ? <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText> : null}
            <Button title={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={() => { save(); }} />
            <Button title="Cancel" variant="secondary" disabled={saving} onPress={onClose} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export function ReadingField({ label, style, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={readingFormStyles.field}>
      <AppText variant="caption" color="secondary">{label}</AppText>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={theme.colors.text.tertiary}
        style={[readingFormStyles.input, { backgroundColor: theme.colors.surface.inset, borderColor: theme.colors.border.default, color: theme.colors.text.primary }, style]} />
    </View>
  );
}

const readingFormStyles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  back: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40 },
  memberName: { flexShrink: 1 },
  vault: { flex: 1, textAlign: 'right' },
  content: { padding: 16, gap: 16 },
  field: { gap: 4 },
  input: { ...textRoles.bodySm, minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, paddingVertical: 8 },
  notes: { minHeight: 64 },
  selectedTest: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 12 },
  rangeToggle: { minHeight: 44, justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, padding: 12, gap: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 8 },
});

// ============================================================================
// ADD TO HEALTH SHEET
// ============================================================================

export function FormSheet({
  title,
  onClose,
  children,
}: React.PropsWithChildren<{ title: string; onClose: () => void }>) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}
      >
        <Pressable style={styles.formDismiss} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.modalPanel,
            styles.formSheet,
            { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, paddingBottom: Math.max(20, insets.bottom + 8) },
          ]}
        >
          <View style={[styles.formGrabber, { backgroundColor: theme.colors.border.default }]} />
          <Row align="center" justify="space-between">
            <AppText variant="heading">{title}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.formClose}>
              <X size={sizes.icon.md} color={theme.colors.text.secondary} />
            </Pressable>
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formBody}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | '';
  onChange: (value: T) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="label" color="secondary" style={styles.formSectionLabel}>{label}</AppText>
      <View style={styles.chipRow}>
        {options.map(option => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: active ? theme.colors.border.interactive : theme.colors.border.default,
                  backgroundColor: active ? theme.colors.surface.raised : theme.colors.surface.canvas,
                },
              ]}
            >
              <AppText variant="label" color={active ? 'primary' : 'secondary'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Stack>
  );
}

export const REMINDER_TYPES = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'medicine', label: 'Take a medicine' },
  { value: 'refill', label: 'Refill' },
  { value: 'other', label: 'Something else' },
] as const;
export const REMINDER_FREQUENCIES = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
] as const;
export const RELATIONS = [
  'Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Brother', 'Sister',
  'Grandfather', 'Grandmother', 'Other',
].map(value => ({ value, label: value }));
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(
  value => ({ value, label: value }),
);

export function toIsoDate(value: string): string | null {
  const text = value.trim();
  let y: number, m: number, d: number;
  const us = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (us) [m, d, y] = [Number(us[1]), Number(us[2]), Number(us[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function HealthDateField({
  label,
  value,
  onChangeText,
  maximumDate,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maximumDate?: Date;
}) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="label" color="secondary" style={styles.formSectionLabel}>{label}</AppText>
      <DatePickerInput
        value={value}
        onChangeText={onChangeText}
        dateFormat="us"
        placeholder="MM/DD/YYYY"
        maximumDate={maximumDate}
        style={[
          styles.formInput,
          { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
        ]}
      />
    </Stack>
  );
}

export function HealthField({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="label" color="secondary" style={styles.formSectionLabel}>{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.text.tertiary}
        style={[
          styles.formInput,
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


// ============================================================================
// STYLES
// ============================================================================
