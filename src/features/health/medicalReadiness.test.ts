import type { HealthMember, HealthRecord } from '../../api/health.api';
import { calculateMedicalReadiness } from './medicalReadiness';

const member: HealthMember = {
  id: 'member', name: 'Arjun', relation: 'Self', createdAt: '', updatedAt: '',
};
const prescription: HealthRecord = {
  id: 'prescription', memberId: 'member', documentId: 'document', type: 'prescription',
  documentDate: null, processingStatus: 'processed', measurementCount: 0,
  trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0, createdAt: '',
};

it('matches the web six-item score including recorded no-known allergies', () => {
  const result = calculateMedicalReadiness({
    ...member,
    bloodGroup: 'O+',
    allergies: 'No known allergies',
    emergencyContactName: 'Divya',
    emergencyContactPhone: '123',
    primaryDoctor: 'Dr Rao',
    insuranceProvider: 'Insurer',
  }, [prescription]);
  expect(result.percentage).toBe(100);
  expect(result.items.every(item => item.ready)).toBe(true);
});

it('requires both contact fields and does not count unknown blood group or conditions', () => {
  const result = calculateMedicalReadiness({
    ...member, bloodGroup: 'Unknown', conditions: 'Asthma', emergencyContactName: 'Divya',
  }, []);
  expect(result.percentage).toBe(0);
  expect(result.items).toHaveLength(6);
  expect(result.items.find(item => item.label === 'Emergency contact')?.ready).toBe(false);
});

it('rounds each of the six items as on web and counts an older prescription', () => {
  const otherRecord = { ...prescription, id: 'other', type: 'lab_report' as const };
  const result = calculateMedicalReadiness({ ...member, primaryDoctor: 'Dr Rao' }, [
    otherRecord, otherRecord, otherRecord, otherRecord, otherRecord, prescription,
  ]);
  expect(result.percentage).toBe(33);
  expect(result.items.find(item => item.label === 'Prescription on file')?.ready).toBe(true);
});
