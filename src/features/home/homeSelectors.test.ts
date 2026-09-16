import type { BootstrapResponse, DocumentRecord } from '../../api/types';
import { parseHomeOverview } from './homeSelectors';

const document = (overrides: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id: 'document-1',
  originalName: 'passport.pdf',
  documentType: 'passport',
  normalizedType: 'passport',
  classificationStatus: 'verified',
  ownershipStatus: 'verified',
  confidence: 0.95,
  createdAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const bootstrap = (overrides: Partial<BootstrapResponse> = {}): BootstrapResponse => ({
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
  documents: [],
  savedPackages: [],
  version: '1.0.0',
  ...overrides,
});

describe('parseHomeOverview', () => {
  it('maps bootstrap data into dashboard metrics', () => {
    const result = parseHomeOverview(
      bootstrap({
        savedPackages: ['travel', 'work'],
        documents: [
          document({ id: 'verified', displayName: 'Passport' }),
          document({
            id: 'pending',
            classificationStatus: 'pending',
            createdAt: '2026-09-02T00:00:00.000Z',
          }),
        ],
      }),
      Date.parse('2026-09-03T00:00:00.000Z'),
    );

    expect(result).toMatchObject({
      name: 'Jane Doe',
      readiness: { complete: 50, packs: 2 },
      documents: { total: 2, needsAttention: 1 },
    });
    expect(result.recent[0]).toMatchObject({
      id: 'pending',
      status: 'Needs classification',
    });
  });

  it('marks documents expiring within sixty days for attention', () => {
    const result = parseHomeOverview(
      bootstrap({
        documents: [
          document({ expiryDate: '2026-10-01T00:00:00.000Z' }),
        ],
      }),
      Date.parse('2026-09-01T00:00:00.000Z'),
    );

    expect(result.documents.needsAttention).toBe(1);
    expect(result.recent[0].status).toBe('Needs renewal');
  });
});
