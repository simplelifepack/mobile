import { request } from './client';

export type GlobalSearchSection =
  | 'packages'
  | 'documents'
  | 'health'
  | 'wealth'
  | 'family'
  | 'trust';

export type GlobalSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  section: GlobalSearchSection;
  navigation: { path: string };
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

export const searchApi = {
  search: (query: string, limit = 5) =>
    request<GlobalSearchResponse>(
      `/api/search?q=${encodeURIComponent(query.slice(0, 160))}&limit=${limit}`,
      { requiresAuth: true },
    ),
};
