import type { BootstrapResponse, DocumentRecord } from '../../api/types';

export type HomeRecentDocument = {
  id: string;
  title: string;
  status: string;
};

export type HomeOverview = {
  name: string;
  readiness: {
    complete: number;
    packs: number;
  };
  documents: {
    total: number;
    needsAttention: number;
  };
  recent: HomeRecentDocument[];
};

function documentTitle(document: DocumentRecord) {
  return (
    document.displayName ??
    document.title ??
    document.originalName ??
    document.documentType
  );
}

function isExpiringSoon(document: DocumentRecord, now: number) {
  if (!document.expiryDate) return false;
  const expiry = Date.parse(document.expiryDate);
  if (Number.isNaN(expiry)) return false;
  const daysUntilExpiry = (expiry - now) / 86_400_000;
  return daysUntilExpiry <= 60;
}

function needsAttention(document: DocumentRecord, now: number) {
  return (
    document.classificationStatus !== 'verified' ||
    document.ownershipStatus !== 'verified' ||
    isExpiringSoon(document, now)
  );
}

function statusLabel(document: DocumentRecord, now: number) {
  if (document.classificationStatus !== 'verified') return 'Needs classification';
  if (document.ownershipStatus !== 'verified') return 'Needs verification';
  if (isExpiringSoon(document, now)) return 'Needs renewal';
  return 'Up to date';
}

export function parseHomeOverview(
  payload: BootstrapResponse,
  now = Date.now(),
): HomeOverview {
  const documents = Array.isArray(payload.documents) ? payload.documents : [];
  const verifiedDocuments = documents.filter(
    document =>
      document.classificationStatus === 'verified' &&
      document.ownershipStatus === 'verified',
  ).length;

  return {
    name: payload.user?.name?.trim() || 'there',
    readiness: {
      complete: documents.length
        ? Math.round((verifiedDocuments / documents.length) * 100)
        : 0,
      packs: Array.isArray(payload.savedPackages)
        ? payload.savedPackages.length
        : 0,
    },
    documents: {
      total: documents.length,
      needsAttention: documents.filter(document =>
        needsAttention(document, now),
      ).length,
    },
    recent: [...documents]
      .sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt),
      )
      .slice(0, 3)
      .map(document => ({
        id: document.id,
        title: documentTitle(document),
        status: statusLabel(document, now),
      })),
  };
}
