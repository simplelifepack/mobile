import type { LockerDocument, LockerSession, LockerSessionStatus } from '../../../api/digilocker.api';

export const MAX_IMPORT_BATCH = 50;
export const POLL_INTERVAL_MS = 1500;
export const MAX_POLL_INTERVAL_MS = 30_000;

export const TERMINAL_STATUSES: readonly LockerSessionStatus[] = [
  'EXPIRED',
  'CANCELLED',
  'CONSENT_DENIED',
  'FAILED',
];

export const STATUS_MESSAGES: Partial<Record<LockerSessionStatus, string>> = {
  PENDING: 'Authorization was not completed. Connect again or cancel.',
  CONSENT_DENIED: 'DigiLocker consent was declined. You can start a new connection.',
  EXPIRED: 'Your DigiLocker session expired. Connect again.',
  CANCELLED: 'DigiLocker connection was cancelled.',
  FAILED: 'DigiLocker authentication failed. Please reconnect.',
};

export const CONSENT_TEXT =
  'ReadiNes will securely copy your selected DigiLocker documents into your account. These copies are encrypted and processed using our existing AI document management system.';

export const isConnected = (session?: LockerSession | null) =>
  session?.status === 'AUTHENTICATED' || session?.status === 'IMPORTING';

export const completedReferences = (session?: LockerSession | null) =>
  new Set(
    (session?.progress ?? [])
      .filter(item => item.phase === 'Completed')
      .map(item => item.reference),
  );

export const importableDocuments = (
  documents: LockerDocument[],
  session?: LockerSession | null,
) => {
  const completed = completedReferences(session);
  return documents.filter(doc => doc.available && !completed.has(doc.reference));
};

export const describeDocument = (doc: LockerDocument) =>
  [
    doc.type,
    doc.issuer,
    doc.issueDate
      ? `Issued: ${doc.issueDate}`
      : doc.modifiedAt
        ? `Modified: ${doc.modifiedAt}`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');
