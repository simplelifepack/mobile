export type AuthUser = {
  accountTier?: 'free' | 'paid';
  id?: string;
  name: string;
  email: string;
  pinConfigured?: boolean;
};

export type AuthResponse = {
  token: string;
  accessToken?: string;
  user: AuthUser;
  deletionCancelled?: boolean;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushNotificationStatus = {
  configured: boolean;
  publicKey: string | null;
  deviceEnabled: boolean;
};

export type PushNotificationSendResult = {
  attempted: number;
  sent: number;
};

export type ResetPasswordResponse = {
  message: string;
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

export type DocumentRecord = {
  id: string;
  title?: string | null;
  displayName?: string | null;
  ownerProfileId?: string | null;
  uniqueIdentifier?: string | null;
  extractedKeyFields?: unknown;
  rawText?: string | null;
  originalName: string;
  storedName?: string;
  mimeType: string;
  size: number;
  path?: string;
  documentType: string;
  normalizedType?: string | null;
  category: string;
  analysisSource: string;
  confidence: number;
  classificationStatus: 'pending' | 'detected' | 'verified' | 'rejected';
  classificationConfidence: number;
  ownershipStatus: 'pending' | 'verified' | 'mismatch' | 'unknown';
  owner?: string;
  expiryDate?: string | null;
  documentDate?: string | null;
  capabilities?: string[];
  readinessEligible: boolean;
  fields: unknown;
  createdAt: string;
  updatedAt: string;
  source: 'MANUAL_UPLOAD' | 'GMAIL' | 'GOOGLE_DRIVE';
  sourceProvider?: string | null;
  driveFileId?: string | null;
  openUrl?: string | null;
  lastAnalyzed?: string | null;
  pages?: DocumentPage[];
};

export type DriveStatus = {
  connected: boolean;
  account: string | null;
  scanStatus: 'idle' | 'scanning' | 'completed' | 'failed';
  lastScannedAt: string | null;
  lastSuccessfulSync: string | null;
  scanning: boolean;
  phase: string | null;
  processed: number;
  total: number;
  indexedCount: number;
  error: string | null;
};

export type DriveScanResult = {
  discovered: number;
  processed: number;
  imported: number;
  skipped: number;
  failed: number;
  indexed: number;
  updated: number;
  unchanged: number;
  ignored: number;
  duplicate: number;
  duplicate_kept: number;
  indexedCount: number;
  lastSuccessfulSync: string;
  message: string;
};

export type Evidence = {
  label: string;
  text: string;
  points: number;
};

export type ReviewField = {
  id?: string;
  key: string;
  label: string;
  value: string;
  confidence?: number;
  source: 'template' | 'rule' | 'generic' | 'ocr' | 'user';
  editable: boolean;
  important?: boolean;
  pageNumber?: number;
};

export type DocumentFieldValidation = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  required: boolean;
  valid: boolean;
  status: 'accepted' | 'needs_review' | 'missing' | 'invalid';
  message?: string;
};

export type DocumentValidationResult = {
  normalizedType: string;
  displayName: string;
  category: string;
  uniqueIdentifierField: string;
  uniqueIdentifier: string | null;
  documentFingerprint: string;
  capabilities: string[];
  validatedFields: Record<string, DocumentFieldValidation>;
  reviewFields: ReviewField[];
  missingRequiredFields: string[];
  invalidFields: string[];
  lowConfidenceFields: string[];
  canSave: boolean;
  requiresUserConfirmation: boolean;
  warnings: Array<{ code: string; message: string }>;
};

export type DocumentAnalysis = {
  analysisSource: 'rules' | 'manual' | 'ai';
  documentType: string;
  category: string;
  confidence: number;
  fields: Record<string, string | number | boolean | string[] | undefined>;
  evidence: Evidence[];
  sourceEvidence: string[];
  reason: string;
};

export type DocumentAIResult = {
  category:
    | 'Identity'
    | 'Employment'
    | 'Finance'
    | 'Insurance'
    | 'Property'
    | 'Medical'
    | 'Education'
    | 'Travel'
    | 'Vehicle'
    | 'Legal'
    | 'Photo'
    | 'Other';
  documentType: string;
  uniqueNumber: string | null;
  nameOnDocument: string | null;
  expiryDate: string | null;
  extractedText?: string;
  fields?: Record<string, string>;
};

export type AnalyzeDocumentResponse = {
  success: true;
  document: DocumentAIResult & {
    title: string;
    ownership: 'mine' | 'other' | 'unknown';
  };
  files: Array<{
    tempFileId: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  warnings: Array<{ code: string; message: string }>;
};

export type {
  GmailCandidate,
  GmailImportResult,
  GmailStatus,
} from './gmail.types';

export type UploadDocumentResponse = AnalyzeDocumentResponse & {
  document?: DocumentRecord;
};

export type HealthMember = {
  id: string;
  name: string;
  relation: string;
  bloodGroup?: string | null;
  dateOfBirth?: string | null;
  conditions?: string | null;
  allergies?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  primaryDoctor?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthMeasurement = {
  id: string;
  createdAt?: string;
  sourceDocumentId: string | null;
  recordId: string | null;
  metricKey: string;
  displayName: string;
  originalName: string;
  value: number;
  secondaryValue?: number | null;
  unit: string;
  context?: string | null;
  bodySite?: string | null;
  referenceMin?: number | null;
  referenceMax?: number | null;
  referenceText?: string | null;
  measuredAt: string | null;
  sourceType: string;
  isTracked?: boolean;
  aliases?: string[];
};

export type HealthRecord = {
  id: string;
  memberId: string;
  documentId: string;
  type: 'lab_report' | 'medical_report' | 'prescription';
  documentDate: string | null;
  provider?: string | null;
  doctor?: string | null;
  processingStatus:
    | 'pending'
    | 'processing'
    | 'processed'
    | 'partial_medication_extraction'
    | 'handwritten_unreadable'
    | 'no_medications_detected'
    | 'ai_processing_disabled'
    | 'failed'
    | 'awaiting_profile_match'
    | string;
  processingError?: string | null;
  measurementCount: number;
  trackedMeasurementCount: number;
  medicationCount: number;
  followUpCount: number;
  createdAt: string;
  processedAt?: string | null;
};

export type HealthRecordDetail = HealthRecord & {
  measurements: HealthMeasurement[];
  medications: Array<{
    id: string;
    name: string;
    dose?: string | null;
    frequency?: string | null;
    whenToTake?: Array<'morning' | 'afternoon' | 'night'>;
    mealTiming?: 'before_food' | 'after_food' | 'with_food' | 'any_time' | null;
    repeatRunsOut?: string | null;
    duration?: string | null;
    quantity?: string | null;
    repeats?: boolean;
    runsOutAt?: string | null;
    status?: 'continuing' | 'stopped' | string;
    stoppedAt?: string | null;
  }>;
  followUps: Array<{
    id: string;
    title: string;
    dueDate?: string | null;
    explicitDate?: string | null;
    sourceText?: string | null;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    type?: 'appointment' | 'medicine' | 'refill' | 'other' | string;
    dueDate: string | null;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | string;
    origin: string;
    status: string;
  }>;
};

export type HealthHomeReminder = {
  id: string;
  title: string;
  type?: 'appointment' | 'medicine' | 'refill' | 'other' | string;
  dueDate: string | null;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | string;
  memberId?: string;
  memberName: string;
  origin: string;
};

export type HealthHomeAttention = {
  reminders: HealthHomeReminder[];
  medications: Array<
    HealthTimelineEvent & {
      memberId: string;
      memberName: string;
    }
  >;
};

export type HealthMemberResolution = {
  type: 'lab_report' | 'medical_report' | 'prescription';
  documentId: string;
  processingStatus: 'awaiting_profile_match';
  patient: {
    name?: string | null;
    dateOfBirth?: string | null;
    age?: number | null;
    gender?: string | null;
  } | null;
  memberMatch: {
    status: 'missing' | 'unmatched' | 'ambiguous';
    candidates: HealthMember[];
  };
  measurements: [];
};

export type HealthProcessResponse =
  | (HealthRecordDetail & {
      patient?: HealthMemberResolution['patient'];
      matchedMember?: HealthMember | null;
    })
  | HealthMemberResolution;

export type TrackedHealthMetric = {
  id: string;
  memberId: string;
  metricKey: string;
  displayName: string;
  context?: string | null;
  bodySite?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HealthAvailableMetric = {
  metricKey: string;
  displayName: string;
  context?: string | null;
  bodySite?: string | null;
  historicalReadingCount: number;
  isTracked: boolean;
  latestValue: number;
  secondaryValue?: number | null;
  unit: string;
};

export type HealthOverview = {
  member: HealthMember;
  upcoming: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    origin: string;
    status: string;
    sourceDocumentId?: string | null;
  }>;
  trackedMetrics: Array<
    TrackedHealthMetric & {
      measurements: HealthMeasurement[];
      latest: HealthMeasurement | null;
    }
  >;
  recentRecords: HealthRecord[];
};

export type HealthTimelineEvent = {
  id: string;
  eventType: 'measurement' | 'medication';
  recordId?: string | null;
  occurredAt: string | null;
  title: string;
  value?: number;
  secondaryValue?: number | null;
  unit?: string;
  detail?: string | null;
  source: string;
  sourceType: string;
  medication?: {
    name: string;
    dose?: string | null;
    frequency?: string | null;
    whenToTake?: Array<'morning' | 'afternoon' | 'night'>;
    mealTiming?: 'before_food' | 'after_food' | 'with_food' | 'any_time' | null;
    duration?: string | null;
    quantity?: string | null;
    repeats: boolean;
    repeatRunsOut?: string | null;
    runsOutAt?: string | null;
    status: 'continuing' | 'stopped' | string;
    stoppedAt?: string | null;
  };
};

export type HealthMedication = {
  id: string;
  memberId: string;
  name: string;
  dose?: string | null;
  frequency?: string | null;
  whenToTake?: Array<'morning' | 'afternoon' | 'night'>;
  mealTiming?: 'before_food' | 'after_food' | 'with_food' | 'any_time' | null;
  duration?: string | null;
  quantity?: string | null;
  status: 'continuing' | 'stopped' | string;
  repeats: boolean;
  repeatRunsOut?: string | null;
  runsOutAt?: string | null;
  stoppedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type SaveDocumentPayload = {
  tempFileIds: string[];
  originalName: string;
  mimeType: string;
  size: number;
  title?: string;
  category: string;
  documentType: string;
  confidence: number;
  fields: Record<string, string | number | boolean | string[] | undefined>;
  reviewFields: ReviewField[];
  rawExtractedText: string;
  warnings?: unknown[];
  extraction?: unknown;
  evidence: Evidence[];
  analysisSource: 'rules' | 'manual' | 'ai';
  duplicateAction?: 'fail' | 'replace' | 'keep_both';
  userConfirmedUnknown?: boolean;
  owner?:
    | 'self'
    | 'spouse'
    | 'father'
    | 'mother'
    | 'child'
    | 'seller'
    | 'buyer'
    | 'employer'
    | 'bank'
    | 'hospital'
    | 'government'
    | 'other'
    | 'unknown';
  subType?: string | null;
  expiry?: string | null;
  verified?: boolean;
};

export type PackSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  aliases?: string[];
  searchMetadata?: PackageSearchMetadata;
  description: string;
  createdBy?: string;
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
  type:
    | 'government'
    | 'official'
    | 'bank'
    | 'university'
    | 'insurance'
    | 'authority';
  retrievedAt: string;
};

export type PackageListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  aliases?: string[];
  searchMetadata?: PackageSearchMetadata;
  description: string;
  createdBy?: string;
  source?: PackSummary['source'];
  verificationSources?: VerificationSource[];
  verificationStatus?: string;
  lastVerifiedAt?: string;
  requirements: PackageRequirement[];
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
};

export type PackageListResponse = {
  query: string;
  categories?: string[];
  items: PackageListItem[];
  matches: Array<{
    id: string;
    name: string;
    slug: string;
    matchType: string;
    confidence: number;
    matchedTokens: string[];
    missingTokens: string[];
  }>;
  hasConfidentMatch: boolean;
  canGenerate: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
};

export type PackageListQuery = {
  category?: string;
  limit?: number;
  location?: string;
  page?: number;
  provider?: string;
  search?: string;
  sort?: 'category' | 'newest' | 'relevance' | 'title';
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
  'AUTO' | 'USER_SELECTED' | 'USER_OVERRIDE';

export type RequirementAssignment = {
  assignmentSource: Exclude<RequirementAssignmentSource, 'AUTO'>;
  documentId: string;
  overriddenAt?: string | null;
};

export type AdminPackageSource = {
  name?: string;
  organization?: string;
  retrievedAt?: string;
  title: string;
  type?: string;
  url: string;
};

export type AdminPackageRequirement = {
  id?: string;
  title: string;
  description?: string;
  required: boolean;
  group: string;
  documentType?: string;
  owner: string;
  metadata?: Record<string, unknown>;
  acceptedDocumentTypes: string[];
  alternativeLabels: string[];
  sortOrder?: number;
};

export type AdminPackagePayload = {
  aliases: string[];
  applicability?: string;
  category: string;
  country?: string;
  description: string;
  keywords: string[];
  lastCheckedAt?: string | null;
  lastVerifiedAt?: string | null;
  requirements: AdminPackageRequirement[];
  searchMetadata?: Record<string, unknown>;
  slug?: string;
  sourceName?: string | null;
  sourceTitle?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sources: AdminPackageSource[];
  subtitle?: string | null;
  title: string;
  verificationStatus?: string | null;
};

export type AdminPackage = Omit<
  PackSummary,
  'requirements' | 'verificationSources' | 'searchMetadata' | 'lastVerifiedAt'
> & {
  aliases: string[];
  createdAt: string;
  deletedAt?: string | null;
  keywords: string[];
  lastCheckedAt?: string | null;
  lastVerifiedAt?: string | null;
  requirements: AdminPackageRequirement[];
  searchMetadata?: Record<string, unknown> | null;
  sourceName?: string | null;
  sourceTitle?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  updatedAt: string;
  verificationSources?: AdminPackageSource[];
  version: number;
};

export type AdminPackageListResponse = {
  categories: string[];
  items: AdminPackage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
};

export type AdminCsvPreviewRow = {
  rowNumber: number;
  slug: string;
  title: string;
  errors: string[];
  input?: AdminPackagePayload | null;
};

export type AdminCsvPreview = {
  rows: AdminCsvPreviewRow[];
  summary: { valid: number; invalid: number };
  errors: string[];
};

export type AdminCsvImportResult = {
  successCount: number;
  failedCount: number;
  results: Array<{
    rowNumber: number;
    status: 'created' | 'failed';
    errors: string[];
  }>;
};

export type FamilyMember = {
  id: string;
  name: string;
  relationship?: string;
};

export type TrustAccessType = {
  id: string;
  code: 'VIEW_ONLY' | 'FAMILY_MEMBER' | 'EMERGENCY_ACCESS' | 'OWNER';
  name: string;
  description: string;
  rules?: unknown;
};

export type TrustPermission = {
  module: 'DOCUMENTS' | 'HEALTH' | 'WEALTH';
  canView: boolean;
  canDownload: boolean;
};

export type TrustMember = {
  id: string;
  name: string;
  email: string;
  relation: string;
  customRelation?: string | null;
  relationLabel: string;
  dateOfBirth: string;
  bloodGroup: string;
  accessType: TrustAccessType;
  status: 'INVITED' | 'ACTIVE' | 'REVOKED' | 'REJECTED';
  invitationStatus: 'PENDING' | 'EXPIRED' | 'ACCEPTED' | 'REJECTED' | 'NONE';
  invitedAt: string;
  inviteExpiresAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  revokedAt?: string | null;
  permissions: TrustPermission[];
  invitationDelivery?: {
    sent: boolean;
    messageId?: string | null;
    reason?: 'email_disabled' | 'invalid_recipient' | 'delivery_failed';
    errorCode?: string;
  };
};

export type TrustMemberPayload = {
  name: string;
  email: string;
  relation:
    | 'SPOUSE'
    | 'PARENT'
    | 'CHILD'
    | 'SIBLING'
    | 'GUARDIAN'
    | 'RELATIVE'
    | 'FRIEND'
    | 'OTHER';
  customRelation?: string;
  dateOfBirth: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  accessTypeCode: 'VIEW_ONLY' | 'FAMILY_MEMBER' | 'EMERGENCY_ACCESS';
  pin?: string;
  permissions: TrustPermission[];
};

export type TrustConnection = {
  id: string;
  owner: { id: string; name: string; email: string };
  relation: string;
  relationLabel: string;
  accessType: TrustAccessType;
  status: 'ACTIVE';
  acceptedAt?: string | null;
};

export type TrustInvitation = {
  id: string;
  ownerName: string;
  memberName: string;
  relationLabel: string;
  accessType: TrustAccessType;
  expiresAt: string;
};

export type TrustCenterResponse = {
  role: 'OWNER' | 'BOTH';
  owner: {
    id: string;
    name: string;
    email: string;
    accessType: 'OWNER';
    note: string;
  };
  memberCount: number;
  members: TrustMember[];
  connections: TrustConnection[];
  accessTypes: TrustAccessType[];
};

export type WealthHandoffRecipient = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  accessType: 'VIEW_ONLY' | 'FAMILY_MEMBER' | 'EMERGENCY_ACCESS';
  accessTypeLabel: string;
  canReceiveHandoff: boolean;
  verificationStatus: 'verified';
  type: 'family' | 'emergency' | 'other';
};

export type WealthRecordType =
  'ASSET' | 'LOAN_TAKEN' | 'LOAN_GIVEN' | 'INSURANCE' | 'PAYMENT_PROOF';

export type WealthRecordPayload = {
  type: WealthRecordType;
  title: string;
  details: Record<string, string | number | boolean | null | string[]>;
  notes?: string;
  followUpDate?: string | null;
  followUpNote?: string;
  attachmentDocumentIds: string[];
};

export type WealthRecord = WealthRecordPayload & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  attachments: Array<{
    id: string;
    documentId: string;
    originalName?: string;
    title?: string | null;
    category?: string;
    mimeType?: string;
    size?: number;
  }>;
  loanBreakdown?: {
    principal?: number;
    interest?: number;
    payments?: number;
    outstanding: number;
    monthsElapsed?: number;
    calculationType?: string;
  } | null;
};

export type DynamicFormOption = string | { label: string; value: string };

export type DynamicFormCategory = {
  code: string;
  label: string;
  description?: string | null;
};

export type DynamicFormSubtype = DynamicFormCategory;

export type DynamicFormField = {
  id: string;
  label: string;
  inputType:
    'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | string;
  required: boolean;
  placeholder?: string | null;
  defaultValue?: string | number | boolean | null;
  options?: DynamicFormOption[] | null;
  validation?: unknown;
  group?: string | null;
  visibility?: unknown;
  order: number;
};

export type DynamicFormSchema = {
  category: DynamicFormCategory;
  subtype: DynamicFormSubtype;
  fields: DynamicFormField[];
};

export type WealthDynamicFormSubmitPayload = {
  categoryCode: string;
  subtypeCode: string;
  values: Record<string, string | number | boolean | null | string[]>;
};

export type WealthHandoffCounts = {
  assets: number;
  insurance: number;
  loans: number;
  financialRecords: number;
  documents: number;
  images: number;
};

export type WealthHandoffSummary = {
  generatedAt: string;
  recipients: {
    family: WealthHandoffRecipient[];
    emergency: WealthHandoffRecipient[];
    other?: WealthHandoffRecipient[];
  };
  handoffTypes: Array<{
    type: 'family' | 'emergency';
    label: string;
    contents: string[];
    excluded: string[];
    counts: WealthHandoffCounts;
  }>;
};

export type WealthHandoffSendResponse = {
  message: string;
  results: Array<{
    recipientId: string;
    email: string;
    handoffType: 'family' | 'emergency';
    sent: boolean;
    messageId?: string | null;
    reason?: 'email_disabled' | 'invalid_recipient' | 'delivery_failed';
    errorCode?: string;
  }>;
};

export type BootstrapResponse = Partial<AccountUsage> & {
  user: AuthUser;
  documentCount: number;
  version: string;
};

export type ReadinessMatchedDocument = {
  id: string;
  originalName: string;
  displayName?: string | null;
  uniqueIdentifier?: string | null;
  normalizedType: string;
  owner?: string;
  confidence?: number;
};

export type PackageLookup = Pick<
  PackSummary,
  'id' | 'title' | 'slug' | 'category' | 'description'
>;

export type PackageSearchOrGenerateResponse = {
  source: 'existing' | 'official_source';
  confidence: number | null;
  matchReason: string | null;
  package: PackSummary;
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

export type CustomPackDraftResponse = {
  draft: {
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
  job?: CustomPackageGenerationJob;
};

export type CustomPackageGenerationJob = {
  id: string;
  status:
    | 'queued'
    | 'researching'
    | 'generating'
    | 'saving'
    | 'completed'
    | 'completed_with_unverified_sources'
    | 'failed';
  statusMessage: string;
  draft?: CustomPackDraftResponse['draft'];
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

export type GlobalSearchSection =
  'packages' | 'documents' | 'health' | 'wealth' | 'family' | 'trust';

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  section: GlobalSearchSection;
  navigation: {
    path: string;
  };
};

export type GlobalSearchGroup = {
  section: GlobalSearchSection;
  label: string;
  results: GlobalSearchResult[];
};

export type GlobalSearchResponse = {
  query: string;
  groups: GlobalSearchGroup[];
};

export type AccountUsage = {
  accountTier: 'free' | 'paid';
  storage: { usedBytes: number; limitBytes: number | null; unlimited: boolean };
  aiUsage: {
    used: number | null;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
    period: string;
  };
};
