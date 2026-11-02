export type AuthUser = {
  id: string;
  name: string;
  email: string;
  pinConfigured?: boolean;
  accountTier?: 'free' | 'paid';
};
export type AuthResponse = {
  token: string;
  accessToken?: string;
  user: AuthUser;
};
export type MessageResponse = { message: string };

export type DocumentRecord = {
  id: string;
  title?: string | null;
  displayName?: string | null;
  rawText?: string | null;
  originalName: string;
  mimeType?: string;
  documentType: string;
  category?: string;
  source?: 'MANUAL_UPLOAD' | 'GMAIL' | 'GOOGLE_DRIVE';
  sourceProvider?: string | null;
  driveFileId?: string | null;
  openUrl?: string | null;
  pages?: DocumentPage[];
  normalizedType?: string | null;
  classificationStatus: 'pending' | 'detected' | 'verified' | 'rejected';
  ownershipStatus: 'pending' | 'verified' | 'mismatch' | 'unknown';
  owner?: string;
  expiryDate?: string | null;
  documentDate?: string | null;
  capabilities?: string[];
  confidence: number;
  createdAt: string;
};

export type DocumentPage = {
  id: string;
  position: number;
  label: string;
  sourceType: string;
  pageCount?: number | null;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicDocumentEncryptionKey = {
  keyId: string;
  keyVersion: number;
  algorithm: 'RSA-OAEP-4096-SHA256';
  publicKeyPem: string;
};

export type EncryptedDocumentEnvelope = {
  wrappedKey: string;
  iv: string;
  encryptionVersion: number;
  keyId: string;
  keyVersion: number;
  contentAlgorithm: 'AES-256-GCM';
  keyAlgorithm: 'RSA-OAEP-4096-SHA256';
  originalFilename: string;
  originalMimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  originalSize: number;
  originalSha256: string;
  encryptedSha256: string;
  aiAnalysisConsent: boolean;
};

export type DocumentAnalysisResponse = {
  success: true;
  document: {
    title: string;
    documentType: string;
    category: string;
    confidence: number;
    fields?: Record<string, unknown>;
    reviewFields?: Array<Record<string, unknown>>;
    rawExtractedText?: string;
    extractedText?: string;
    evidence?: Array<Record<string, unknown>>;
    ownership?: 'mine' | 'other' | 'unknown';
  };
  files: Array<{
    tempFileId: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  warnings: Array<{ code?: string; message: string }>;
};

export type DocumentSavePayload = {
  tempFileIds: string[];
  originalName?: string;
  mimeType?: string;
  size?: number;
  title: string;
  category: string;
  documentType: string;
  confidence: number;
  fields: Record<string, unknown>;
  reviewFields: Array<Record<string, unknown>>;
  rawExtractedText: string;
  warnings: Array<{ code?: string; message: string }>;
  evidence: Array<Record<string, unknown>>;
  analysisSource: 'ai' | 'rules';
  duplicateAction: 'fail' | 'replace' | 'keep_both';
  owner: 'self';
  userConfirmedUnknown: boolean;
  verified: boolean;
};

export type DocumentSaveResponse = {
  document: DocumentRecord;
  validation?: {
    canSave: boolean;
    requiresUserConfirmation: boolean;
    warnings: Array<{ code?: string; message: string }>;
  };
};

export type BootstrapResponse = {
  user: AuthUser;
  documents: DocumentRecord[];
  savedPackages: string[];
  version: string;
};

export type PackageRequirement = {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  group?: string;
  owner?: string;
  metadata?: Record<string, string | number | boolean | null> | null;
  acceptedDocumentTypes: string[];
  assignment?: RequirementAssignment;
};

export type RequirementAssignmentSource =
  | 'AUTO'
  | 'USER_SELECTED'
  | 'USER_OVERRIDE';

export type RequirementAssignment = {
  assignmentSource: Exclude<RequirementAssignmentSource, 'AUTO'>;
  documentId: string;
  overriddenAt?: string | null;
};

export type PackageSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  description: string;
  aliases?: string[];
  createdBy?: string;
  searchMetadata?: PackageSearchMetadata;
  source?: {
    name?: string;
    title?: string;
    url?: string;
    lastCheckedAt?: string;
  };
  verificationSources?: VerificationSource[];
  verificationStatus?: string;
  lastVerifiedAt?: string;
  requirements: PackageRequirement[];
};

export type VerificationSource = {
  title: string;
  organization: string;
  url: string;
  type: 'government' | 'official' | 'bank' | 'university' | 'insurance' | 'authority';
  retrievedAt: string;
};

export type PackageSearchMetadata = {
  confidence?: string;
  disclaimer?: string;
  passportCountries?: string[];
  intent?: string;
  searchPhrases: string[];
  jurisdiction?: string;
  destination?: string;
  purpose?: string;
  subject?: string;
  referenceId?: string;
  referenceSource?: string;
  uiAccent?: string;
  uiIcon?: string;
  hasVerifiedOfficialSource?: boolean;
};

export type CustomPackPayload = {
  description?: string;
  requirements: string[];
  searchMetadata?: Record<string, unknown>;
  source?: {
    name?: string;
    title?: string;
    url?: string;
    lastCheckedAt?: string;
  };
  title: string;
  verificationSources?: VerificationSource[];
  verificationStatus?: string;
};

export type CustomPackDraft = {
  packageName: string;
  category: string;
  description: string;
  searchMetadata: PackageSearchMetadata;
  sourceTitle: string;
  sourceUrl: string;
  sourceOrganization: string;
  lastChecked: string;
  verificationSources: VerificationSource[];
  lastVerifiedAt: string | null;
  verificationStatus: string;
  hasVerifiedOfficialSource?: boolean;
  confidence?: string;
  disclaimer?: string;
  requiredDocuments: Array<{
    id: string;
    category: string;
    documentType: string;
    owner: string;
    name: string;
    title: string;
    required: boolean;
    whyNeeded: string;
  }>;
};

export type CustomPackDraftResponse = {
  draft: CustomPackDraft;
  job?: CustomPackageGenerationJob;
};

export type CustomPackageGenerationJob = {
  id: string;
  status: 'queued' | 'researching' | 'generating' | 'saving' | 'completed' | 'completed_with_unverified_sources' | 'failed';
  statusMessage: string;
  draft?: CustomPackDraft;
  errorMessage?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  queueWaitMs?: number;
  aiMs?: number;
  processingMs?: number;
  retryCount: number;
  provider429Count: number;
  hasVerifiedOfficialSource: boolean;
  confidence?: string;
  disclaimer?: string;
};

export type CustomPackageGenerationJobResponse = {
  job: CustomPackageGenerationJob;
};

export type PackageListResponse = {
  query: string;
  items: PackageSummary[];
  hasConfidentMatch: boolean;
  canGenerate: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
};

export type PackageSearchResponse = {
  source: 'existing' | 'official_source';
  confidence: number | null;
  matchReason: string | null;
  package: PackageSummary;
};
