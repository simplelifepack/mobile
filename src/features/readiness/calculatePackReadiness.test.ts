import { calculatePackReadiness } from './calculatePackReadiness';
import type { DocumentRecord, PackageRequirement } from '../../api/types';

const requirement = (
  acceptedDocumentTypes: string[],
  metadata?: PackageRequirement['metadata'],
): PackageRequirement => ({
  id: 'requirement',
  title: 'Identity',
  required: true,
  acceptedDocumentTypes,
  metadata,
});
const document = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id: 'document',
  originalName: 'passport.pdf',
  documentType: 'passport',
  normalizedType: 'passport',
  classificationStatus: 'verified',
  ownershipStatus: 'verified',
  owner: 'self',
  confidence: 0.9,
  createdAt: '2026-08-30T00:00:00.000Z',
  ...overrides,
});

describe('calculatePackReadiness', () => {
  it('matches normalized document types and capabilities', () => {
    const result = calculatePackReadiness(
      [requirement(['driving_licence'])],
      [
        document({
          normalizedType: 'identity_card',
          capabilities: ['driving license'],
        }),
      ],
    );
    expect(result.percentage).toBe(100);
    expect(result.requirements[0].status).toBe('ready');
  });

  it('rejects expired, mismatched-owner, and stale documents', () => {
    const requirements = [requirement(['passport'], { maxAgeDays: 30 })];
    const result = calculatePackReadiness(
      requirements,
      [
        document({ owner: 'spouse' }),
        document({ expiryDate: '2026-01-01' }),
        document({ documentDate: '2026-01-01' }),
      ],
      Date.parse('2026-09-03'),
    );
    expect(result).toMatchObject({
      satisfiedRequired: 0,
      missingRequired: 1,
      percentage: 0,
    });
  });

  it('does not count documents awaiting verification', () => {
    const result = calculatePackReadiness(
      [requirement(['passport'])],
      [document({ classificationStatus: 'pending' })],
    );

    expect(result.satisfiedRequired).toBe(0);
    expect(result.requirements[0].status).toBe('missing');
  });
});
