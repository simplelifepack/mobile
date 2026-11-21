import React, { useState } from 'react';
import type { HealthExtraction, HealthUploadReview } from '../../../api/healthExtraction';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { Stack } from '../../../components/primitives/Stack';
import { FormSheet, HealthField, toIsoDate } from './HealthForms';

type Medication = HealthExtraction['medications'][number];

export function PrescriptionReviewSheet({ extraction, onClose, onSave }: {
  extraction: HealthExtraction;
  onClose: () => void;
  onSave: (review: HealthUploadReview) => Promise<void>;
}) {
  const [draft, setDraft] = useState(extraction);
  const [patientAge, setPatientAge] = useState(extraction.patient?.age?.toString() ?? '');
  const [measurementValues, setMeasurementValues] = useState(
    extraction.measurements.map(item => String(item.value)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const updateMedication = (index: number, patch: Partial<Medication>) => {
    setDraft(current => ({
      ...current,
      medications: current.medications.map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  };

  const save = async () => {
    if (saving) return;
    if (draft.medications.some(item => !item.name.trim())) {
      setError('Enter a name for each medicine or remove the empty medicine.');
      return;
    }
    const date = draft.documentDate?.trim();
    if (date && !toIsoDate(date)) {
      setError('Enter a valid prescription date in YYYY-MM-DD format.');
      return;
    }
    const dob = draft.patient?.dateOfBirth?.trim();
    if (dob && !toIsoDate(dob)) {
      setError('Enter a valid date of birth in YYYY-MM-DD format.');
      return;
    }
    const age = patientAge.trim();
    if (age && (!/^\d+$/.test(age) || Number(age) > 120)) {
      setError('Enter a patient age between 0 and 120.');
      return;
    }
    if (draft.followUps.some(item => !item.title.trim() || (item.explicitDate && !toIsoDate(item.explicitDate)))) {
      setError('Enter a title and a valid date for each follow-up, or remove it.');
      return;
    }
    if (draft.measurements.some((item, index) =>
      !item.name.trim() || !item.unit.trim() || !measurementValues[index]?.trim() ||
      !Number.isFinite(Number(measurementValues[index])),
    )) {
      setError('Enter a name, numeric value and unit for each reading, or remove it.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        extraction: {
          ...draft,
          documentDate: date ? toIsoDate(date) : null,
          patient: draft.patient || age ? {
            ...draft.patient,
            dateOfBirth: dob ? toIsoDate(dob) : null,
            age: age ? Number(age) : null,
          } : null,
          medications: draft.medications.map(item => ({
            ...item,
            name: item.name.trim(),
          })),
          measurements: draft.measurements.map((item, index) => ({
            ...item, name: item.name.trim(), unit: item.unit.trim(), value: Number(measurementValues[index]),
          })),
          followUps: draft.followUps.map(item => ({
            ...item,
            title: item.title.trim(),
            explicitDate: item.explicitDate ? toIsoDate(item.explicitDate) : null,
          })),
        },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSheet title={extraction.documentType === 'prescription' ? 'Review prescription' : 'Review lab report'} onClose={() => { if (!saving) onClose(); }}>
      <Stack gap="md">
        <AppText variant="caption" color="secondary">
          AI may misread handwriting. Compare every detail with the original prescription before saving. Do not rely on this as medical advice.
        </AppText>
        {draft.prescriptionAnalysis?.message ? (
          <AppText variant="caption" color="secondary">{draft.prescriptionAnalysis.message}</AppText>
        ) : null}
        {draft.patient?.identityConflicting ? (
          <AppText variant="caption" color="danger">
            Patient details conflict across pages. Check the original; clinical data may not be processed until the conflict is resolved.
          </AppText>
        ) : null}
        <HealthField
          label="Patient name"
          value={draft.patient?.name ?? ''}
          editable={!saving}
          onChangeText={name => setDraft(current => ({ ...current, patient: { ...current.patient, name } }))}
        />
        <HealthField label="Patient date of birth (YYYY-MM-DD)" value={draft.patient?.dateOfBirth ?? ''} editable={!saving}
          onChangeText={dateOfBirth => setDraft(current => ({ ...current, patient: { ...current.patient, dateOfBirth } }))} />
        <HealthField label="Patient age" value={patientAge} editable={!saving} keyboardType="number-pad"
          onChangeText={setPatientAge} />
        <HealthField label="Patient gender" value={draft.patient?.gender ?? ''} editable={!saving}
          onChangeText={gender => setDraft(current => ({ ...current, patient: { ...current.patient, gender } }))} />
        <HealthField label="Patient allergies" value={draft.patient?.allergies ?? ''} editable={!saving}
          onChangeText={allergies => setDraft(current => ({ ...current, patient: { ...current.patient, allergies } }))} />
        <HealthField label="Patient conditions" value={draft.patient?.conditions ?? ''} editable={!saving}
          onChangeText={conditions => setDraft(current => ({ ...current, patient: { ...current.patient, conditions } }))} />
        <HealthField label="Doctor" value={draft.doctor ?? ''} editable={!saving}
          onChangeText={doctor => setDraft(current => ({ ...current, doctor }))} />
        <HealthField label="Hospital or provider" value={draft.provider ?? ''} editable={!saving}
          onChangeText={provider => setDraft(current => ({ ...current, provider }))} />
        <HealthField label={extraction.documentType === 'prescription' ? 'Prescription date (YYYY-MM-DD)' : 'Report date (YYYY-MM-DD)'} value={draft.documentDate ?? ''} editable={!saving}
          onChangeText={documentDate => setDraft(current => ({ ...current, documentDate }))} />
        <AppText variant="heading">Medicines</AppText>
        {!draft.medications.length ? (
          <AppText variant="caption" color="secondary">No medicines were detected. Add them from the original if needed.</AppText>
        ) : null}
        {draft.medications.map((medication, index) => (
          <Stack key={index} gap="sm">
            <AppText variant="label">Medicine {index + 1}</AppText>
            <HealthField label="Medicine name" value={medication.name} editable={!saving}
              onChangeText={name => updateMedication(index, { name })} />
            <HealthField label="Dose" value={medication.dose ?? ''} editable={!saving}
              onChangeText={dose => updateMedication(index, { dose })} />
            <HealthField label="Frequency" value={medication.frequency ?? ''} editable={!saving}
              onChangeText={frequency => updateMedication(index, { frequency })} />
            <HealthField label="Duration" value={medication.duration ?? ''} editable={!saving}
              onChangeText={duration => updateMedication(index, { duration })} />
            <HealthField label="Quantity" value={medication.quantity ?? ''} editable={!saving}
              onChangeText={quantity => updateMedication(index, { quantity })} />
            <Button title={`Remove medicine ${index + 1}`} variant="ghost" disabled={saving}
              onPress={() => setDraft(current => ({
                ...current, medications: current.medications.filter((_, i) => i !== index),
              }))} />
          </Stack>
        ))}
        <Button title="Add medicine" variant="secondary" disabled={saving}
          onPress={() => setDraft(current => ({
            ...current, medications: [...current.medications, { name: '' }],
          }))} />
        {draft.measurements.length ? <AppText variant="heading">Readings</AppText> : null}
        {draft.measurements.map((measurement, index) => (
          <Stack key={index} gap="sm">
            <HealthField label={`Reading ${index + 1} name`} value={measurement.name} editable={!saving}
              onChangeText={name => setDraft(current => ({
                ...current, measurements: current.measurements.map((item, i) => i === index ? { ...item, name, metricKey: null } : item),
              }))} />
            <HealthField label={`Reading ${index + 1} value`} value={measurementValues[index]} editable={!saving} keyboardType="decimal-pad"
              onChangeText={value => setMeasurementValues(current => current.map((item, i) => i === index ? value : item))} />
            <HealthField label={`Reading ${index + 1} unit`} value={measurement.unit} editable={!saving}
              onChangeText={unit => setDraft(current => ({
                ...current, measurements: current.measurements.map((item, i) => i === index ? { ...item, unit } : item),
              }))} />
            {measurement.secondaryValue != null || measurement.referenceText || measurement.referenceMin != null || measurement.referenceMax != null || measurement.context || measurement.bodySite ? (
              <AppText variant="caption" color="secondary">
                {[
                  measurement.secondaryValue != null ? `Secondary value: ${measurement.secondaryValue}` : '',
                  measurement.referenceText ? `Range: ${measurement.referenceText}` : '',
                  measurement.referenceMin != null ? `Minimum: ${measurement.referenceMin}` : '',
                  measurement.referenceMax != null ? `Maximum: ${measurement.referenceMax}` : '',
                  measurement.context ? `Context: ${measurement.context}` : '',
                  measurement.bodySite ? `Body site: ${measurement.bodySite}` : '',
                ].filter(Boolean).join(' · ')}. Remove this reading if these details are incorrect.
              </AppText>
            ) : null}
            <Button title={`Remove reading ${index + 1}`} variant="ghost" disabled={saving}
              onPress={() => {
                setDraft(current => ({ ...current, measurements: current.measurements.filter((_, i) => i !== index) }));
                setMeasurementValues(current => current.filter((_, i) => i !== index));
              }} />
          </Stack>
        ))}
        {draft.followUps.length ? <AppText variant="heading">Follow-ups</AppText> : null}
        {draft.followUps.map((followUp, index) => (
          <Stack key={index} gap="sm">
            <HealthField label={`Follow-up ${index + 1}`} value={followUp.title} editable={!saving}
              onChangeText={title => setDraft(current => ({
                ...current, followUps: current.followUps.map((item, i) => i === index ? { ...item, title } : item),
              }))} />
            <HealthField label="Follow-up date (YYYY-MM-DD)" value={followUp.explicitDate ?? ''} editable={!saving}
              onChangeText={explicitDate => setDraft(current => ({
                ...current, followUps: current.followUps.map((item, i) => i === index ? { ...item, explicitDate } : item),
              }))} />
            {followUp.recommendedAfter ? (
              <AppText variant="caption" color="secondary">
                Detected interval: {followUp.recommendedAfter.value} {followUp.recommendedAfter.unit}
              </AppText>
            ) : null}
            <Button title={`Remove follow-up ${index + 1}`} variant="ghost" disabled={saving}
              onPress={() => setDraft(current => ({
                ...current, followUps: current.followUps.filter((_, i) => i !== index),
              }))} />
          </Stack>
        ))}
        <AppText variant="caption" color="secondary">
          The patient may be matched to a profile or a new profile may be created after saving. You may be asked to choose one.
        </AppText>
        {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
        <Button title={saving ? 'Saving…' : 'Confirm and save'} disabled={saving} onPress={() => { save(); }} />
        <Button title="Cancel upload" variant="ghost" disabled={saving} onPress={onClose} />
      </Stack>
    </FormSheet>
  );
}
