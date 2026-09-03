import type { DocumentRecord, PackageRequirement } from '../../api/types';
export type DerivedRequirement = PackageRequirement & {
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
function normalize(value?: string | null) {
  const key = (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const aliases: Record<string, string> = {
    driving_license: 'driving_licence',
    photograph: 'photo',
    recent_photograph: 'photo',
    profile_photo: 'photo',
    passport_size_photo: 'passport_photo',
    passport_size_photograph: 'passport_photo',
    id_photo: 'passport_photo',
  };
  return aliases[key] ?? key;
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
  return Boolean(
    document.normalizedType && document.normalizedType !== 'unknown',
  );
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
export function calculatePackReadiness(
  requirements: PackageRequirement[],
  documents: DocumentRecord[],
  now = Date.now(),
): PackReadiness {
  const available = documents.filter(document => usable(document, now));
  const derived = requirements.map((requirement): DerivedRequirement => {
    const accepted = new Set(requirement.acceptedDocumentTypes.map(normalize));
    const matched = available
      .filter(
        document =>
          normalize(requirement.owner ?? 'self') ===
          normalize(document.owner ?? 'self'),
      )
      .filter(document =>
        [
          normalize(document.normalizedType),
          ...(document.capabilities ?? []).map(normalize),
        ].some(type => accepted.has(type)),
      )
      .filter(document => metadataMatches(requirement, document, now))
      .sort((left, right) => right.confidence - left.confidence)[0];
    return {
      ...requirement,
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
