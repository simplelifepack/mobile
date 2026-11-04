import type { DocumentRecord, PackageSummary } from '../../api/types';
import {
  documentRequirementTypes,
  normalizeRequirementValue,
} from '../readiness/calculatePackReadiness';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function documentNotes(document: DocumentRecord) {
  const notes = document.fields?.documentNotes;
  return typeof notes === 'string' ? notes : '';
}

/** A user-set expiry (even a cleared one) wins over the extracted date. */
export function documentExpiry(document: DocumentRecord) {
  const fields = document.fields ?? {};
  const value = Object.hasOwn(fields, 'userExpiry')
    ? fields.userExpiry
    : document.expiryDate;
  return typeof value === 'string' && ISO_DATE.test(value.slice(0, 10)) ? value.slice(0, 10) : '';
}

export function daysUntil(isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86_400_000);
}

export function assignedPersonId(document: DocumentRecord) {
  const assigned = document.fields?.assignedPerson as { id?: string } | undefined;
  return assigned?.id;
}

export function documentSourceLabel(document: DocumentRecord) {
  if (document.sourceProvider === 'DIGILOCKER') return 'DigiLocker';
  if (document.source === 'GOOGLE_DRIVE') return 'Google Drive';
  if (document.source === 'GMAIL') return 'Gmail';
  return 'Upload';
}

export function documentSizeLabel(document: DocumentRecord) {
  return document.size
    ? `${Math.max(1, Math.round(document.size / 1024)).toLocaleString()} KB`
    : undefined;
}

export type PackageUse = { pack: PackageSummary; required: boolean };

export function packagesUsingDocument(
  document: DocumentRecord,
  packages: PackageSummary[],
): PackageUse[] {
  const types = new Set(documentRequirementTypes(document));
  return packages.flatMap(pack => {
    const matches = pack.requirements.filter(
      requirement =>
        requirement.assignment?.documentId === document.id ||
        requirement.acceptedDocumentTypes.some(type =>
          types.has(normalizeRequirementValue(type)),
        ),
    );
    return matches.length
      ? [{ pack, required: matches.some(requirement => requirement.required) }]
      : [];
  });
}
