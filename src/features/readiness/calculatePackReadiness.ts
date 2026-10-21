import type { DocumentRecord, PackageRequirement } from '../../api/types';
export type DerivedRequirement = PackageRequirement & {
  assignmentSource: 'AUTO' | 'USER_SELECTED' | 'USER_OVERRIDE' | null;
  status: 'ready' | 'missing';
  matchedDocument?: DocumentRecord;
};
export type PackReadiness = {
  totalRequired: number;
  satisfiedRequired: number;
  missingRequired: number;
  percentage: number;
  requirements: DerivedRequirement[];
};
export function normalizeRequirementValue(value?: string | null) {
  const key = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const aliases: Record<string, string> = {
    driving_license: 'driving_licence',
    aadhar: 'aadhaar',
    aadhaar_card: 'aadhaar',
    photograph: 'photo',
    recent_photograph: 'photo',
    profile_photo: 'photo',
    passport_size_photo: 'passport_photo',
    passport_size_photograph: 'passport_photo',
    id_photo: 'passport_photo',
  };
  return aliases[key] ?? key;
}
function documentType(document: DocumentRecord) {
  return normalizeRequirementValue(
    document.normalizedType ?? document.documentType,
  );
}
function documentRequirementTypes(document: DocumentRecord) {
  const type = documentType(document);
  const implied: Record<string, string[]> = {
    aadhaar: ['identity_proof', 'address_proof', 'date_of_birth_proof'],
    pan: ['identity_proof', 'tax_identifier', 'financial_identity'],
    passport: [
      'identity_proof',
      'nationality_proof',
      'travel_document',
      'photo_id',
      'date_of_birth_proof',
      'address_proof',
    ],
    driving_licence: [
      'identity_proof',
      'address_proof',
      'photo_id',
      'age_proof',
      'driving_authorization',
    ],
    voter_id: ['identity_proof', 'address_proof', 'photo_id'],
    birth_certificate: ['date_of_birth_proof', 'identity_proof'],
  };
  return [
    type,
    ...(implied[type] ?? []),
    ...(document.capabilities ?? []).map(normalizeRequirementValue),
  ];
}
function usable(document: DocumentRecord, now: number) {
  if (
    document.classificationStatus === 'rejected' ||
    document.ownershipStatus === 'mismatch'
  )
    return false;
  if (
    document.expiryDate &&
    !Number.isNaN(Date.parse(document.expiryDate)) &&
    Date.parse(document.expiryDate) < now
  )
    return false;
  const type = documentType(document);
  return Boolean(type && type !== 'unknown');
}
function metadataMatches(
  requirement: PackageRequirement,
  document: DocumentRecord,
  now: number,
) {
  const maxAgeDays = requirement.metadata?.maxAgeDays;
  if (typeof maxAgeDays !== 'number') return true;
  const timestamp = Date.parse(document.documentDate ?? document.createdAt);
  return (
    Number.isNaN(timestamp) || (now - timestamp) / 86_400_000 <= maxAgeDays
  );
}
export function documentMatchesRequirement(
  requirement: PackageRequirement,
  document: DocumentRecord,
  now = Date.now(),
) {
  if (!usable(document, now)) return false;
  const accepted = new Set(
    requirement.acceptedDocumentTypes.map(normalizeRequirementValue),
  );
  return (
    normalizeRequirementValue(requirement.owner ?? 'self') ===
      normalizeRequirementValue(document.owner ?? 'self') &&
    documentRequirementTypes(document).some(type => accepted.has(type)) &&
    metadataMatches(requirement, document, now)
  );
}
export function calculatePackReadiness(
  requirements: PackageRequirement[],
  documents: DocumentRecord[],
  now = Date.now(),
): PackReadiness {
  const available = documents.filter(document => usable(document, now));
  const derived = requirements.map((requirement): DerivedRequirement => {
    const assigned = requirement.assignment
      ? available.find(document => document.id === requirement.assignment?.documentId)
      : undefined;
    if (assigned) {
      return {
        ...requirement,
        assignmentSource: requirement.assignment!.assignmentSource,
        status: 'ready',
        matchedDocument: assigned,
      };
    }
    const accepted = new Set(
      requirement.acceptedDocumentTypes.map(normalizeRequirementValue),
    );
    const matched = available
      .filter(
        document =>
          normalizeRequirementValue(requirement.owner ?? 'self') ===
          normalizeRequirementValue(document.owner ?? 'self'),
      )
      .filter(document =>
        documentRequirementTypes(document).some(type => accepted.has(type)),
      )
      .filter(document => metadataMatches(requirement, document, now))
      .sort((left, right) => right.confidence - left.confidence)[0];
    return {
      ...requirement,
      assignmentSource: matched ? 'AUTO' : null,
      status: matched ? 'ready' : 'missing',
      ...(matched ? { matchedDocument: matched } : {}),
    };
  });
  const required = derived.filter(item => item.required);
  const satisfiedRequired = required.filter(
    item => item.status === 'ready',
  ).length;
  return {
    totalRequired: required.length,
    satisfiedRequired,
    missingRequired: required.length - satisfiedRequired,
    percentage: required.length
      ? Math.round((satisfiedRequired / required.length) * 100)
      : 0,
    requirements: derived,
  };
}
