import type { DocumentRecord } from '../../api/types';
import { documentAttention } from './documentAttention';

const document: DocumentRecord = {
  id: 'one', originalName: 'report.pdf', documentType: 'Report',
  classificationStatus: 'verified', ownershipStatus: 'verified', confidence: 1,
  createdAt: '2026-01-01',
};
const now = new Date(2026, 10, 9, 23, 30);

it('distinguishes expired, today, and expiring documents by calendar day', () => {
  expect(documentAttention({ ...document, expiryDate: '2026-11-08' }, now)).toMatchObject({ label: 'Expired 1 day ago', overdue: true });
  expect(documentAttention({ ...document, expiryDate: '2026-11-09' }, now)).toMatchObject({ label: 'Expires today', overdue: false });
  expect(documentAttention({ ...document, expiryDate: '2026-11-10' }, now)).toMatchObject({ label: 'Expires in 1 day', overdue: false });
  expect(documentAttention({ ...document, expiryDate: '2027-01-08' }, now)).toBeDefined();
  expect(documentAttention({ ...document, expiryDate: '2027-01-09' }, now)).toBeUndefined();
});

it('uses the user-edited expiry, including a cleared expiry, and ignores invalid dates', () => {
  expect(documentAttention({ ...document, expiryDate: '2026-11-08', fields: { userExpiry: null } }, now)).toBeUndefined();
  expect(documentAttention({ ...document, expiryDate: '2026-11-08', fields: { userExpiry: '2026-11-10' } }, now)?.label).toBe('Expires in 1 day');
  expect(documentAttention({ ...document, expiryDate: '2026-02-30' }, now)).toBeUndefined();
});
