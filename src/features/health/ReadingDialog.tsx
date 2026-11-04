import React from 'react';
import { compareMeasurements } from './healthMetrics';
import { readingUnitError } from './readingValidation';
import { Alert } from 'react-native';
import { useFormDraft } from '../shared/useFormDraft';
import { ErrorState } from '../../components/feedback/ErrorState';
import { AppModal as Modal } from '../../components/primitives/AppModal';
import type { HealthMeasurement } from '../../api/web.types';
import { healthApi } from '../../api/health.api';
import {
  ModalSurface,
  ModalOptions,
  ModalContent,
} from '../../components/primitives/Layout';
import { DialogHeader } from '../shared/DialogHeader';
import {
  AppText,
  Button,
  TextInput,
  Stack,
  Choice,
  isDate,
} from '../shared/FeatureUI';
export function ReadingDialog({
  memberId,
  memberName,
  measurements,
  initialTest,
  trackedTests = [],
  onClose,
  onSaved,
}: {
  memberId: string;
  memberName: string;
  measurements: HealthMeasurement[];
  trackedTests?: Array<
    Pick<
      HealthMeasurement,
      | 'metricKey'
      | 'displayName'
      | 'unit'
      | 'context'
      | 'bodySite'
      | 'secondaryValue'
    >
  >;
  initialTest?: Pick<
    HealthMeasurement,
    | 'metricKey'
    | 'displayName'
    | 'unit'
    | 'context'
    | 'bodySite'
    | 'secondaryValue'
  >;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tests = React.useMemo(() => {
    const items = new Map<string, NonNullable<typeof initialTest>>();
    for (const item of trackedTests)
      items.set(
        [item.metricKey, item.context ?? '', item.bodySite ?? ''].join('|'),
        item,
      );
    if (initialTest)
      items.set(
        [
          initialTest.metricKey,
          initialTest.context ?? '',
          initialTest.bodySite ?? '',
        ].join('|'),
        initialTest,
      );
    [...measurements].sort(compareMeasurements).forEach(item => {
      items.set(
        [item.metricKey, item.context ?? '', item.bodySite ?? ''].join('|'),
        item,
      );
    });
    return [...items].sort((a, b) =>
      a[1].displayName.localeCompare(b[1].displayName),
    );
  }, [measurements, initialTest, trackedTests]);
  const today = React.useRef(new Date());
  const now = today.current;
  const draft = useFormDraft(
    `Health reading:${memberId}${initialTest ? `:${[initialTest.metricKey, initialTest.context ?? '', initialTest.bodySite ?? ''].join('|')}` : ''}`,
    {
      selected: initialTest
        ? [
            initialTest.metricKey,
            initialTest.context ?? '',
            initialTest.bodySite ?? '',
          ].join('|')
        : (tests[0]?.[0] ?? 'new'),
      name: '',
      unit:
        initialTest?.unit ??
        tests.find(([key]) => key === (tests[0]?.[0] ?? 'new'))?.[1].unit ??
        '',
      value: '',
      second: '',
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      low: '',
      high: '',
    },
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const selected = draft.values.selected;
  const setSelected = (next: string) => {
    draft.change('selected', next);
    draft.change('unit', tests.find(([key]) => key === next)?.[1].unit ?? '');
    setFieldErrors(current => ({ ...current, selected: '' }));
  };
  const name = draft.values.name;
  const setName = (next: string) => {
    draft.change('name', next);
    setFieldErrors(current => ({ ...current, name: '' }));
  };
  const unit = draft.values.unit;
  const setUnit = (next: string) => {
    draft.change('unit', next);
    setFieldErrors(current => ({ ...current, unit: '' }));
  };
  const value = draft.values.value;
  const setValue = (next: string) => {
    draft.change('value', next);
    setFieldErrors(current => ({ ...current, value: '' }));
  };
  const second = draft.values.second;
  const setSecond = (next: string) => {
    draft.change('second', next);
    setFieldErrors(current => ({ ...current, second: '' }));
  };
  const date = draft.values.date;
  const setDate = (next: string) => {
    draft.change('date', next);
    setFieldErrors(current => ({ ...current, date: '' }));
  };
  const low = draft.values.low;
  const setLow = (next: string) => {
    draft.change('low', next);
    setFieldErrors(current => ({ ...current, low: '' }));
  };
  const high = draft.values.high;
  const setHigh = (next: string) => {
    draft.change('high', next);
    setFieldErrors(current => ({ ...current, high: '' }));
  };
  const [error, setError] = React.useState<unknown>(null);
  const [busy, setBusy] = React.useState(false);
  const submitting = React.useRef(false);
  const test = tests.find(([key]) => key === selected)?.[1];
  const custom = selected === 'new' || !test;
  const validateReading = () => {
    const displayName = custom ? name.trim() : test?.displayName;
    const testUnit = unit.trim();
    const errors: Record<string, string> = {};
    if (!displayName || !/[\p{L}\p{N}]/u.test(displayName))
      errors.name = 'Enter the name printed on your report.';
    if (!testUnit)
      errors.unit =
        'Enter the unit printed beside the value, for example mg/dL.';
    const unitError = readingUnitError(displayName ?? '', testUnit);
    if (unitError) errors.unit = unitError;
    if (!value.trim() || !Number.isFinite(Number(value)))
      errors.value = 'Enter a numeric reading without its unit.';
    if (!isDate(date)) errors.date = 'Enter a real date in YYYY-MM-DD format.';
    for (const [key, entry] of Object.entries({ second, low, high }))
      if (entry.trim() && !Number.isFinite(Number(entry)))
        errors[key] = 'Enter a number or leave this optional field blank.';
    if (low.trim() && high.trim() && Number(low) > Number(high)) {
      errors.low = 'The minimum must be below or equal to the maximum.';
      errors.high = 'The maximum must be above or equal to the minimum.';
    }
    return errors;
  };
  const invalid = validateReading();
  const save = async () => {
    if (submitting.current) return;
    const displayName = custom ? name.trim() : test?.displayName;
    const testUnit = unit.trim();
    const errors = validateReading();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await healthApi.createMeasurement(memberId, {
        metricKey: custom
          ? displayName!
              .toLowerCase()
              .replace(/[^\p{L}\p{N}]+/gu, '_')
              .replace(/^_+|_+$/g, '')
          : test!.metricKey,
        displayName: displayName!,
        originalName: displayName!,
        value: Number(value),
        secondaryValue: second.trim() ? Number(second) : null,
        unit: testUnit!,
        context: custom ? null : test?.context,
        bodySite: custom ? null : test?.bodySite,
        referenceMin: low.trim() ? Number(low) : null,
        referenceMax: high.trim() ? Number(high) : null,
        referenceText:
          low.trim() || high.trim() ? `${low} - ${high}`.trim() : null,
        measuredAt: date,
      });
      await draft.clear().catch(() => undefined);
      onSaved();
      onClose();
      Alert.alert(
        'Reading saved',
        'It now appears in this profile’s readings and timeline. You can log another value or review the trend.',
      );
    } catch (reason) {
      setError(reason);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <ModalSurface>
        <DialogHeader title="Log a reading" onClose={onClose} disabled={busy} />
        <ModalOptions keyboardShouldPersistTaps="handled">
          <ModalContent>
            <AppText variant="caption" color="muted">
              {memberName} · Add the value shown on your report
            </AppText>
            {draft.notice ? (
              <AppText variant="caption" color="secondary">
                {draft.notice}
              </AppText>
            ) : null}
            <Choice
              label="Test"
              value={selected}
              options={[
                ...tests.map(([key, item]) => ({
                  value: key,
                  label: item.displayName,
                })),
                { label: 'Add a new test', value: 'new' },
              ]}
              onChange={setSelected}
              disabled={busy}
            />
            {custom ? (
              <>
                <TextInput
                  label="Test name"
                  error={fieldErrors.name}
                  onBlur={() =>
                    setFieldErrors(current => ({
                      ...current,
                      name: invalid.name ?? '',
                    }))
                  }
                  value={name}
                  onChangeText={setName}
                  editable={!busy}
                />
              </>
            ) : (
              <AppText color="muted">
                {test?.displayName} · {test?.unit}
              </AppText>
            )}
            {
              <TextInput
                label="Unit"
                error={fieldErrors.unit}
                onBlur={() =>
                  setFieldErrors(current => ({
                    ...current,
                    unit: invalid.unit ?? '',
                  }))
                }
                value={unit}
                onChangeText={setUnit}
                editable={!busy}
              />
            }
            <TextInput
              label="Value"
              error={fieldErrors.value}
              onBlur={() =>
                setFieldErrors(current => ({
                  ...current,
                  value: invalid.value ?? '',
                }))
              }
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              editable={!busy}
            />
            {test?.secondaryValue != null ||
            /pressure/i.test(custom ? name : (test?.displayName ?? '')) ? (
              <TextInput
                label="Second value"
                error={fieldErrors.second}
                onBlur={() =>
                  setFieldErrors(current => ({
                    ...current,
                    second: invalid.second ?? '',
                  }))
                }
                value={second}
                onChangeText={setSecond}
                keyboardType="decimal-pad"
                editable={!busy}
              />
            ) : null}
            <TextInput
              label="Date (YYYY-MM-DD)"
              error={fieldErrors.date}
              onBlur={() =>
                setFieldErrors(current => ({
                  ...current,
                  date: invalid.date ?? '',
                }))
              }
              value={date}
              onChangeText={setDate}
              editable={!busy}
            />
            <Stack gap="sm">
              <AppText variant="label">Reference range (optional)</AppText>
              <TextInput
                label="Low"
                error={fieldErrors.low}
                onBlur={() =>
                  setFieldErrors(current => ({
                    ...current,
                    low: invalid.low ?? '',
                  }))
                }
                value={low}
                onChangeText={setLow}
                keyboardType="decimal-pad"
                editable={!busy}
              />
              <TextInput
                label="High"
                error={fieldErrors.high}
                onBlur={() =>
                  setFieldErrors(current => ({
                    ...current,
                    high: invalid.high ?? '',
                  }))
                }
                value={high}
                onChangeText={setHigh}
                keyboardType="decimal-pad"
                editable={!busy}
              />
            </Stack>
            {error ? <ErrorState error={error} /> : null}
            {Object.keys(invalid).length ? (
              <AppText variant="caption" color="secondary">
                {Object.values(invalid)[0]}
              </AppText>
            ) : null}
            <Button
              title={busy ? 'Saving…' : 'Save reading'}
              onPress={() => {
                void save();
              }}
              disabled={busy || Object.keys(invalid).length > 0}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              disabled={busy}
            />
          </ModalContent>
        </ModalOptions>
      </ModalSurface>
    </Modal>
  );
}
