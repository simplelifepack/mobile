import { fallbackHealthExtraction, needsPrescriptionReview, type HealthExtraction } from './healthExtraction';

const extraction: HealthExtraction = {
  documentType: 'prescription', measurements: [], medications: [], followUps: [],
  prescriptionAnalysis: { isHandwritten: true, hasUnreadableMedicationText: false, outcome: 'medications_detected' },
};

it('reviews every extracted health document and nothing else', () => {
  expect(needsPrescriptionReview(extraction)).toBe(true);
  expect(needsPrescriptionReview({ ...extraction, documentType: 'lab_report', prescriptionAnalysis: null })).toBe(true);
  expect(needsPrescriptionReview(null)).toBe(false);
  expect(needsPrescriptionReview(undefined)).toBe(false);
});

it('builds a confirmation extraction for medical documents without server extraction', () => {
  const built = fallbackHealthExtraction({
    category: 'Medical', documentType: 'Prescription', fields: { patientName: 'Asha', doctorName: 'Dr Rao', hospitalName: 'City Hospital' },
  });
  expect(built).toMatchObject({ documentType: 'prescription', patient: { name: 'Asha' }, doctor: 'Dr Rao', provider: 'City Hospital' });
  expect(needsPrescriptionReview(built)).toBe(true);
  expect(fallbackHealthExtraction({ category: 'Identity', documentType: 'Passport' })).toBeUndefined();
});
