import React,{ useState } from 'react';
import {
KeyboardAvoidingView,
Modal,
Pressable,
ScrollView,
TextInput,
View
} from 'react-native';

import {
X
} from 'lucide-react-native';


import {
healthApi,
type MealTiming,
type MedicationTime,
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { styles } from '../healthStyles';
import { sizes } from '../../../design/tokens/sizes';

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

export function formatUsDate(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export function HealthReadingForm({
  memberId,
  memberName,
  onClose,
  onCreated,
}: {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('HbA1c');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('%');
  const [measuredAt, setMeasuredAt] = useState(formatUsDate(new Date()));
  const [rangeLow, setRangeLow] = useState('');
  const [rangeHigh, setRangeHigh] = useState('');
  const [customTest, setCustomTest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

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
    const measuredIso = toIsoDate(measuredAt);
    if (!measuredIso) {
      setError('Enter the date as MM/DD/YYYY.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const rangeContext =
        rangeLow.trim() || rangeHigh.trim()
          ? `Reference range: ${rangeLow.trim() || '—'} to ${rangeHigh.trim() || '—'}`
          : null;
      await healthApi.createMeasurement(memberId, {
        metricKey: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        displayName: name.trim(),
        originalName: name.trim(),
        value: numericValue,
        unit: unit.trim(),
        context: rangeContext,
        measuredAt: new Date(measuredIso).toISOString(),
      });
      await onCreated();
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
    <FormSheet title={`Log a reading for ${memberName}`} onClose={onClose}>
      <Stack gap="xs">
        <AppText variant="label" color="secondary" style={styles.formSectionLabel}>Test</AppText>
        <View style={styles.chipRow}>
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
        </View>
      </Stack>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setCustomTest(true);
          setName('');
          setUnit('');
        }}
      >
        <AppText variant="body" color="secondary">Add a test not listed</AppText>
      </Pressable>
      {customTest ? (
        <HealthField label="Test name" value={name} onChangeText={setName} placeholder="Enter test name" />
      ) : null}
      <Row gap="sm">
        <View style={styles.readingValueField}>
          <HealthField
            label={unit ? `Value (${unit})` : 'Value'}
            value={value}
            onChangeText={setValue}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.readingValueField}>
          <HealthDateField label="Date" value={measuredAt} onChangeText={setMeasuredAt} maximumDate={new Date()} />
        </View>
      </Row>
      {customTest ? (
        <HealthField label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. mg/dL" />
      ) : null}
      <Row gap="sm">
        <View style={styles.readingValueField}>
          <HealthField label="Range low (optional)" value={rangeLow} onChangeText={setRangeLow} placeholder="as printed" keyboardType="decimal-pad" />
        </View>
        <View style={styles.readingValueField}>
          <HealthField label="Range high (optional)" value={rangeHigh} onChangeText={setRangeHigh} placeholder="as printed" keyboardType="decimal-pad" />
        </View>
      </Row>
      <AppText variant="caption" color="secondary">
        Copy the test name, value, unit, and reference range from your report. A reading without a range can be recorded without a status.
      </AppText>
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
      <Button title={saving ? 'Saving…' : 'Save reading'} disabled={saving} onPress={() => { save(); }} />
    </FormSheet>
  );
}

// ============================================================================
// ADD TO HEALTH SHEET
// ============================================================================

export function MedicationForm({
  memberId,
  onClose,
  onCreated,
}: {
  memberId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [mealTiming, setMealTiming] = useState('After Food');
  const [runsOutAt, setRunsOutAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    if (!name.trim() || !dose.trim()) {
      setError('Medication name and dose are required.');
      return;
    }
    const runsOutIso = runsOutAt.trim() ? toIsoDate(runsOutAt) : null;
    if (runsOutAt.trim() && !runsOutIso) {
      setError('Enter the repeat date as MM/DD/YYYY.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await healthApi.createMedication(memberId, {
        name: name.trim(),
        dose: dose.trim(),
        whenToTake: [timeOfDay.toLowerCase() as MedicationTime],
        mealTiming: mealTiming.toLowerCase().replace(' ', '_') as MealTiming,
        repeatRunsOut: runsOutIso,
      });
      await onCreated();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add medication.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet title="Add medication" onClose={onClose}>
      <Row gap="sm">
        <View style={styles.medicationNameField}>
          <HealthField label="Name" value={name} onChangeText={setName} placeholder="e.g. Metformin" />
        </View>
        <View style={styles.medicationDoseField}>
          <HealthField label="Dose" value={dose} onChangeText={setDose} placeholder="500 mg" />
        </View>
      </Row>
      <ChoiceChips label="When to take it" options={TIMES_OF_DAY} value={timeOfDay} onChange={setTimeOfDay} />
      <ChoiceChips label="With meals" options={MEAL_TIMINGS} value={mealTiming} onChange={setMealTiming} />
      <HealthDateField label="Repeat runs out (optional)" value={runsOutAt} onChangeText={setRunsOutAt} />
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
      <Button title={saving ? 'Saving…' : 'Add medication'} disabled={saving} onPress={() => { save(); }} />
    </FormSheet>
  );
}

export const TIMES_OF_DAY = ['Morning', 'Afternoon', 'Night'].map(value => ({ value, label: value }));
export const MEAL_TIMINGS = ['Before Food', 'After Food', 'With Food', 'Any Time'].map(
  value => ({ value, label: value }),
);

export function FormSheet({
  title,
  onClose,
  children,
}: React.PropsWithChildren<{ title: string; onClose: () => void }>) {
  const { theme } = useAppTheme();
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim }]}
      >
        <Pressable style={styles.formDismiss} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            styles.modalPanel,
            styles.formSheet,
            { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
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

export function HealthMemberForm({
  onClose,
  onSave,
  initialName = '',
}: {
  onClose: () => void;
  initialName?: string;
  onSave: (payload: {
    name: string;
    relation: string;
    bloodGroup: string | null;
    dateOfBirth: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [relation, setRelation] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const resolvedRelation = relation === 'Other' ? customRelation.trim() : relation;
    if (!name.trim()) return setError('Name is required.');
    if (!resolvedRelation) return setError('Relation is required.');
    const dobIso = dateOfBirth.trim() ? toIsoDate(dateOfBirth) : null;
    if (dateOfBirth.trim() && !dobIso) {
      return setError('Enter a valid date of birth (MM/DD/YYYY).');
    }
    if (dobIso && Date.parse(dobIso) > Date.now()) {
      return setError('Date of birth cannot be in the future.');
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        name: name.trim(),
        relation: resolvedRelation,
        bloodGroup: bloodGroup === 'Unknown' ? null : bloodGroup,
        dateOfBirth: dobIso,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet title="Add a family member" onClose={onClose}>
      <HealthField label="Name" value={name} onChangeText={setName} placeholder="e.g. Lakshmi Iyer" />
      <ChoiceChips label="Relation" options={RELATIONS} value={relation} onChange={setRelation} />
      {relation === 'Other' ? (
        <HealthField label="Custom relation" value={customRelation} onChangeText={setCustomRelation} placeholder="e.g. Uncle" />
      ) : null}
      <ChoiceChips label="Blood group" options={BLOOD_GROUPS} value={bloodGroup} onChange={setBloodGroup} />
      <HealthDateField label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} maximumDate={new Date()} />
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
      <Button title={saving ? 'Saving…' : 'Create profile'} disabled={saving} onPress={() => { save(); }} />
    </FormSheet>
  );
}

export function HealthReminderForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: {
    title: string;
    type: string;
    dueDate: string;
    frequency: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof REMINDER_TYPES)[number]['value'] | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<(typeof REMINDER_FREQUENCIES)[number]['value'] | ''>('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !type || !dueDate.trim() || !frequency) {
      return setError('Title, what for, due date, and how often are required.');
    }
    const dueIso = toIsoDate(dueDate);
    if (!dueIso) {
      return setError('Enter the due date as MM/DD/YYYY.');
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({ title: title.trim(), type, dueDate: dueIso, frequency });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet title="Add reminder" onClose={onClose}>
      <HealthField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Cardiology follow-up" maxLength={180} />
      <ChoiceChips label="What for" options={REMINDER_TYPES} value={type} onChange={setType} />
      <HealthDateField label="Due" value={dueDate} onChangeText={setDueDate} />
      <ChoiceChips label="How often" options={REMINDER_FREQUENCIES} value={frequency} onChange={setFrequency} />
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
      <Button title={saving ? 'Saving…' : 'Add reminder'} disabled={saving} onPress={() => { save(); }} />
    </FormSheet>
  );
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
