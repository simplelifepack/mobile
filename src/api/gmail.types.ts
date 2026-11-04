import type { AnalyzeDocumentResponse } from './web.types';

export type GmailStatus = {
  connected: boolean;
  account: string | null;
  lastScannedAt: string | null;
  scanning: boolean;
};

export type GmailCandidate = {
  id: string;
  externalAttachmentId: string | null;
  filename: string;
  mimeType: string;
  size: number;
  sender: string;
  subject: string;
  receivedAt: string;
  suggestedCategory: string;
  suggestedDocumentType: string;
  relevanceReason: string;
  relevanceScore: number;
  legitimacyReason: string;
  legitimacyScore: number;
  reviewRequired: boolean;
  matchedSignals: string[];
  rejectedSignals: string[];
  ignoredReason: string | null;
  status:
    | 'candidate'
    | 'needs_review'
    | 'ignored'
    | 'dismissed'
    | 'pending_review'
    | 'imported'
    | 'import_failed';
};

export type GmailImportResult = {
  candidateId: string;
  status: 'ready_for_review' | 'already_imported' | 'failed';
  documentId?: string;
  analysis?: AnalyzeDocumentResponse;
  message?: string;
};
