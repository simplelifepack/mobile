export type AuthUser = { id: string; name: string; email: string };
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
  originalName: string;
  documentType: string;
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
};

export type PackageSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  source?: {
    name?: string;
    title?: string;
    url?: string;
    lastCheckedAt?: string;
  };
  requirements: PackageRequirement[];
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
