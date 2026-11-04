import type { DocumentRecord } from '../../../api/types';
import type { HealthMember, HealthRecord } from '../../../api/health.api';

const NOT_ANSWERED = 'Not answered';

export type EmergencyCardRow = { label: string; value: string };

const known = (value?: string | null) => (value && value !== 'Unknown' ? value : NOT_ANSWERED);

const isInsuranceDocument = (document: DocumentRecord) =>
  /insurance|policy/.test(`${document.category} ${document.documentType}`.toLowerCase());

// Prefer an insurance document already attached to a health record, as the web card does.
function findInsuranceDocument(records: HealthRecord[], documents: DocumentRecord[]) {
  const ids = new Set(records.map(record => record.documentId));
  return documents.find(document => ids.has(document.id) && isInsuranceDocument(document))
    ?? documents.find(isInsuranceDocument);
}

function medicineSummary(records: HealthRecord[]) {
  const total = records.reduce((sum, record) => sum + record.medicationCount, 0);
  return total ? `${total} medication${total === 1 ? '' : 's'} on file` : NOT_ANSWERED;
}

export function buildEmergencyCardRows(
  member: HealthMember,
  records: HealthRecord[],
  documents: DocumentRecord[],
): EmergencyCardRow[] {
  const insurance = findInsuranceDocument(records, documents);
  const contact = [member.emergencyContactName, member.emergencyContactPhone].filter(Boolean).join(' · ');

  return [
    { label: 'Name', value: member.name },
    { label: 'Blood group', value: known(member.bloodGroup) },
    { label: 'Critical allergies', value: member.allergies || NOT_ANSWERED },
    { label: 'Conditions', value: member.conditions || NOT_ANSWERED },
    { label: 'Current meds', value: medicineSummary(records) },
    { label: 'Primary physician', value: member.primaryDoctor || NOT_ANSWERED },
    { label: 'Preferred hospital', value: records.find(record => record.provider)?.provider || NOT_ANSWERED },
    { label: 'Emergency contact', value: contact || '-' },
    {
      label: 'Insurance',
      value: insurance ? insurance.title || insurance.originalName : member.insuranceProvider || NOT_ANSWERED,
    },
    { label: 'Medical documents', value: `${records.length} on file in Readines` },
  ];
}
