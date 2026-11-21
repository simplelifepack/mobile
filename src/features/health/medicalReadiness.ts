import type { HealthMember, HealthRecord } from '../../api/health.api';

export function calculateMedicalReadiness(member: HealthMember, records: HealthRecord[]) {
  const items = [
    { label: 'Blood group', ready: Boolean(member.bloodGroup && member.bloodGroup !== 'Unknown') },
    { label: 'Allergies recorded', ready: Boolean(member.allergies) },
    { label: 'Emergency contact', ready: Boolean(member.emergencyContactName && member.emergencyContactPhone) },
    { label: 'Primary doctor', ready: Boolean(member.primaryDoctor) },
    { label: 'Insurance on file', ready: Boolean(member.insuranceProvider) },
    { label: 'Prescription on file', ready: records.some(record => record.type === 'prescription') },
  ];
  return {
    items,
    percentage: Math.round(items.filter(item => item.ready).length / items.length * 100),
  };
}
