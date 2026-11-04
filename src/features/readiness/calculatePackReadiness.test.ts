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
});

it('honors a saved user override while continuing to reject expired assigned documents', () => {
  const assigned: PackageRequirement = {
    ...requirement(['passport']),
    assignment: { documentId: 'document', assignmentSource: 'USER_OVERRIDE' },
  };
  const accepted = calculatePackReadiness(
    [assigned],
    [document({ normalizedType: 'identity_card', owner: 'spouse' })],
  );
  expect(accepted.percentage).toBe(100);
  expect(accepted.requirements[0].assignmentSource).toBe('USER_OVERRIDE');
  const expired = calculatePackReadiness(
    [assigned],
    [document({ expiryDate: '2020-01-01' })],
  );
  expect(expired.percentage).toBe(0);
});
it('recognizes the same implied identity capabilities as the web app', () => {
  expect(
    calculatePackReadiness([requirement(['address_proof'])], [document()])
      .percentage,
  ).toBe(100);
});

it.each([
  'Aadhaar (UIDAI) Card',
  'Permanent Account Number Card',
  'PAN Verification Record',
])('recognizes %s as identity evidence', name => {
  expect(
    calculatePackReadiness(
      [requirement(['identity_proof'])],
      [document({ normalizedType: undefined, documentType: name })],
    ).percentage,
  ).toBe(100);
});

it('maps Aadhaar to generic identity and address requirements while preserving specific document requirements', () => {
  const result = calculatePackReadiness(
    [
      requirement(['identity_document']),
      { ...requirement(['address_proof']), id: 'address' },
      { ...requirement(['pan']), id: 'pan' },
      { ...requirement(['passport']), id: 'passport' },
    ],
    [
      document({
        normalizedType: 'aadhaar',
        documentType: 'aadhaar',
        capabilities: ['aadhaar'],
        owner: 'self',
        classificationStatus: 'detected',
        ownershipStatus: 'verified',
      }),
    ],
  );
  expect(result.requirements.map(r => r.status)).toEqual([
    'ready',
    'ready',
    'missing',
    'missing',
  ]);
});

it.each([
  'financial_proof',
  'medical_document',
  'education_proof',
  'employment_proof',
  'property_proof',
  'insurance_proof',
  'custom_farm_certificate',
])(
  'matches server-provided capabilities for any document category: %s',
  capability => {
    const result = calculatePackReadiness(
      [requirement([capability])],
      [
        document({
          normalizedType: 'catalogue_document',
          documentType: 'catalogue_document',
          capabilities: [capability],
        }),
      ],
    );
    expect(result.percentage).toBe(100);
  },
);

it('ranks exact types first and narrower capability matches independently of upload order', () => {
  const licence = document({
    id: 'licence',
    normalizedType: 'driving_licence',
    confidence: 99,
  });
  const aadhaar = document({
    id: 'aadhaar',
    normalizedType: 'aadhaar',
    confidence: 95,
  });
  const pan = document({ id: 'pan', normalizedType: 'pan', confidence: 95 });
  const requirements = [
    requirement(['driving_licence']),
    { ...requirement(['address_proof']), id: 'address' },
    { ...requirement(['identity_proof']), id: 'identity' },
  ];
  for (const docs of [
    [licence, aadhaar, pan],
    [pan, aadhaar, licence],
  ]) {
    expect(
      calculatePackReadiness(requirements, docs).requirements.map(
        r => r.matchedDocument?.id,
      ),
    ).toEqual(['licence', 'aadhaar', 'aadhaar']);
  }
});
it('preserves a user-selected document even when another automatic match ranks higher', () => {
  const licence = document({
    id: 'licence',
    normalizedType: 'driving_licence',
  });
  const aadhaar = document({ id: 'aadhaar', normalizedType: 'aadhaar' });
  const slot = {
    ...requirement(['address_proof']),
    assignment: {
      documentId: 'licence',
      assignmentSource: 'USER_SELECTED' as const,
    },
  };
  expect(
    calculatePackReadiness([slot], [licence, aadhaar]).requirements[0]
      .matchedDocument?.id,
  ).toBe('licence');
});
it('does not count one account-holder Aadhaar as both child and parent documents', () => {
  const roles = ['Child Aadhaar card', 'Parent Aadhaar card'].map(
    (title, i) => ({
      ...requirement(['aadhaar']),
      id: `role-${i}`,
      title,
      owner: 'self',
    }),
  );
  const aadhaar = document({ normalizedType: 'aadhaar' });
  expect(calculatePackReadiness(roles, [aadhaar]).satisfiedRequired).toBe(0);
  const child = { ...aadhaar, id: 'child', owner: 'child' };
  expect(
    calculatePackReadiness(roles, [aadhaar, child]).satisfiedRequired,
  ).toBe(1);
  roles[1].assignment = {
    documentId: aadhaar.id,
    assignmentSource: 'USER_SELECTED',
  };
  expect(
    calculatePackReadiness(roles, [aadhaar, child]).satisfiedRequired,
  ).toBe(2);
});
