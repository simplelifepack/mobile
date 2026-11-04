import type { DocumentRecord, PackageRequirement } from '../../api/types';
type ReadinessMatchedDocument = DocumentRecord;

export type DerivedRequirement = PackageRequirement & {
  assignmentSource: 'AUTO' | 'USER_SELECTED' | 'USER_OVERRIDE' | null;
  status: 'ready' | 'missing';
  matchedDocument?: ReadinessMatchedDocument;
};

export type PackReadiness = {
  totalRequired: number;
  satisfiedRequired: number;
  missingRequired: number;
  percentage: number;
  requirements: DerivedRequirement[];
};

export function normalizeRequirementValue(value: string | null | undefined) {
  const key = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const aliases: Record<string, string> = {
    driving_license: 'driving_licence',
    aadhar: 'aadhaar',
    identity_document: 'identity_proof',
    aadhaar_card: 'aadhaar',
    aadhaar_uidai_card: 'aadhaar',
    aadhaar_card_uidai: 'aadhaar',
    aadhar_card: 'aadhaar',
    pan_card: 'pan',
    permanent_account_number: 'pan',
    permanent_account_number_card: 'pan',
    pan_verification_record: 'pan',
    photograph: 'photo',
    recent_photograph: 'photo',
    profile_photo: 'photo',
    passport_size_photo: 'passport_photo',
    passport_size_photograph: 'passport_photo',
    id_photo: 'passport_photo',
  };
  return aliases[key] ?? key;
}

function usableDocumentType(document: DocumentRecord) {
  return normalizeRequirementValue(
    document.normalizedType ?? document.documentType,
  );
}

export function documentRequirementTypes(document: DocumentRecord) {
  const type = usableDocumentType(document);
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

function isUsable(document: DocumentRecord, now: number) {
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
  const type = usableDocumentType(document);
  return Boolean(type && type !== 'unknown');
}

export function requirementOwner(
  requirement: Pick<PackageRequirement, 'title' | 'owner'>,
): string | null {
  const owner = normalizeRequirementValue(requirement.owner ?? 'self');
  if (owner === 'unknown') return null;
  if (owner !== 'self') return owner;
  if (/^(?:child|son|daughter)(?:[’']s)?\b/i.test(requirement.title.trim()))
    return 'child';
  // A parent may be the account holder or someone else; require an explicit choice.
  if (/^(?:parent|parents)(?:[’']s)?\b/i.test(requirement.title.trim()))
    return null;
  return owner;
}

function ownerMatches(
  requirement: PackageRequirement,
  document: DocumentRecord,
) {
  return (
    requirementOwner(requirement) ===
    normalizeRequirementValue(document.owner ?? 'self')
  );
}

function metadataMatches(
  requirement: PackageRequirement,
  document: DocumentRecord,
  now: number,
) {
  const maxAgeDays = requirement.metadata?.maxAgeDays;
  if (typeof maxAgeDays !== 'number') return true;
  const date = document.documentDate ?? document.createdAt;
  const timestamp = Date.parse(date);
  return (
    Number.isNaN(timestamp) || (now - timestamp) / 86_400_000 <= maxAgeDays
  );
}

function toMatchedDocument(document: DocumentRecord): ReadinessMatchedDocument {
  return document;
}

export function documentMatchesRequirement(
  requirement: PackageRequirement,
  document: DocumentRecord,
  now = Date.now(),
) {
  if (!isUsable(document, now)) return false;
  const accepted = new Set(
    requirement.acceptedDocumentTypes.map(normalizeRequirementValue),
  );
  return (
    ownerMatches(requirement, document) &&
    documentRequirementTypes(document).some(type => accepted.has(type)) &&
    metadataMatches(requirement, document, now)
  );
}

export function calculatePackReadiness(
  requirements: PackageRequirement[],
  documents: DocumentRecord[],
  now = Date.now(),
): PackReadiness {
  const usable = documents.filter(document => isUsable(document, now));
  const derived = requirements.map((requirement): DerivedRequirement => {
    const assignment = requirement.assignment;
    const assigned = assignment
      ? usable.find(document => document.id === assignment.documentId)
      : undefined;
    if (assignment && assigned) {
      return {
        ...requirement,
        assignmentSource: assignment.assignmentSource,
        matchedDocument: toMatchedDocument(assigned),
        status: 'ready',
      };
    }
    const accepted = new Set(
      requirement.acceptedDocumentTypes.map(normalizeRequirementValue),
    );
    const matched = usable
      .filter(document => ownerMatches(requirement, document))
      .filter(document =>
        documentRequirementTypes(document).some(type => accepted.has(type)),
      )
      .filter(document => metadataMatches(requirement, document, now))
      .sort((left, right) => {
        const exact = (document: DocumentRecord) =>
          Number(accepted.has(usableDocumentType(document)));
        const breadth = (document: DocumentRecord) =>
          new Set(
            documentRequirementTypes(document).filter(
              type => !accepted.has(type),
            ),
          ).size;
        return (
          exact(right) - exact(left) ||
          breadth(left) - breadth(right) ||
          right.confidence - left.confidence ||
          left.id.localeCompare(right.id)
        );
      })[0];
    return {
      ...requirement,
      assignmentSource: matched ? 'AUTO' : null,
      status: matched ? 'ready' : 'missing',
      ...(matched ? { matchedDocument: toMatchedDocument(matched) } : {}),
    };
  });
  const required = derived.filter(requirement => requirement.required);
  const satisfiedRequired = required.filter(
    requirement => requirement.status === 'ready',
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
