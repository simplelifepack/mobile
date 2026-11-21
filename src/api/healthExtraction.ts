export type HealthDocumentType = 'lab_report' | 'medical_report' | 'prescription';

export type HealthExtraction = {
  documentType: HealthDocumentType;
  patient?: {
    name?: string | null;
    dateOfBirth?: string | null;
    age?: number | null;
    gender?: string | null;
    relation?: string | null;
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown' | null;
    conditions?: string | null;
    allergies?: string | null;
    identityConflicting?: boolean;
  } | null;
  documentDate?: string | null;
  provider?: string | null;
  doctor?: string | null;
  measurements: Array<{
    name: string;
    metricKey?: string | null;
    value: number;
    secondaryValue?: number | null;
    unit: string;
    referenceMin?: number | null;
    referenceMax?: number | null;
    referenceText?: string | null;
    context?: string | null;
    bodySite?: string | null;
  }>;
  medications: Array<{
    name: string;
    dose?: string | null;
    frequency?: string | null;
    duration?: string | null;
    quantity?: string | null;
  }>;
  followUps: Array<{
    title: string;
    explicitDate?: string | null;
    recommendedAfter?: { value: number; unit: 'days' | 'weeks' | 'months' | 'years' } | null;
    sourceText?: string | null;
  }>;
  /** Set by the app when the server returned no extraction, so the user confirms the basics. */
  needsConfirmation?: boolean;
  prescriptionAnalysis?: {
    isHandwritten: boolean;
    hasUnreadableMedicationText: boolean;
    outcome: 'not_prescription' | 'medications_detected' | 'partial_medications_detected' | 'handwriting_unreadable' | 'no_medications_detected';
    message?: string | null;
  } | null;
};

export type HealthUploadReview = {
  extraction: HealthExtraction;
  memberId?: string;
};

/**
 * Like the web app, every document the AI classified as clinical is confirmed
 * by the user (patient, doctor, hospital and extracted values) before saving.
 */
export function needsPrescriptionReview(extraction?: HealthExtraction | null): extraction is HealthExtraction {
  return Boolean(extraction);
}

const textField = (fields: Record<string, unknown> | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = fields?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

/**
 * The analyze endpoint doesn't always return a health extraction. For medical
 * documents, build one from the detected fields so the user can confirm the
 * patient, doctor and hospital before it is saved.
 */
export function fallbackHealthExtraction(document: {
  category: string;
  documentType: string;
  fields?: Record<string, unknown>;
}): HealthExtraction | undefined {
  if (document.category !== 'Medical') return undefined;
  const type: HealthDocumentType = /prescription/i.test(document.documentType)
    ? 'prescription'
    : /lab|blood|test|pathology/i.test(document.documentType) ? 'lab_report' : 'medical_report';
  const fields = document.fields;
  return {
    documentType: type,
    needsConfirmation: true,
    patient: { name: textField(fields, ['patientName', 'nameOnDocument', 'holderName', 'name']) },
    doctor: textField(fields, ['doctorName', 'doctor', 'prescribingDoctor', 'consultant']),
    provider: textField(fields, ['hospitalName', 'hospital', 'provider', 'clinic', 'clinicName', 'laboratory']),
    documentDate: null,
    measurements: [],
    medications: [],
    followUps: [],
    prescriptionAnalysis: null,
  };
}
