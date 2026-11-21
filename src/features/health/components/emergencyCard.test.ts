import type { HealthMember } from '../../../api/health.api';
import { buildEmergencyCardRows } from './emergencyCard';

it('uses the profile preferred hospital in the emergency card', () => {
  const member: HealthMember = {
    id: '1', name: 'Arjun', relation: 'Self', preferredHospital: 'City Hospital',
    createdAt: '', updatedAt: '',
  };
  expect(buildEmergencyCardRows(member, [], []).find(row => row.label === 'Preferred hospital')?.value)
    .toBe('City Hospital');
});
