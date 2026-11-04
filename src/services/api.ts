import { publicDocumentLabels } from '../api/public-document-labels';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { packagesApi, type PackageQuery } from '../api/packages.api';
import { userApi } from '../api/user.api';
import type {
  BootstrapResponse,
  PackageListResponse,
  PackageSearchResponse,
  PackageSummary,
} from '../api/types';

function errorValue(error: unknown) {
  const issue = error as { status?: number; code?: string } | undefined;
  return {
    error: {
      message: error instanceof Error ? error.message : 'Request failed.',
      status: issue?.status,
      code: issue?.code,
    },
  };
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<{
    message: string;
    status?: number;
    code?: string;
  }>(),
  tagTypes: ['Bootstrap', 'Packages'],
  endpoints: builder => ({
    bootstrap: builder.query<BootstrapResponse, void>({
      async queryFn() {
        try {
          return { data: await userApi.bootstrap() };
        } catch (error) {
          return errorValue(error);
        }
      },
      providesTags: ['Bootstrap'],
      keepUnusedDataFor: 300,
    }),
    packages: builder.query<PackageListResponse, PackageQuery>({
      async queryFn(query, queryApi) {
        try {
          return {
            data: await packagesApi.list(
              query,
              queryApi.forced,
              queryApi.signal,
            ),
          };
        } catch (error) {
          return errorValue(error);
        }
      },
      // Cache each full query independently; ReadinessScreen combines pages.
      // Merging here too duplicated cumulative page arrays in screen state.
      providesTags: ['Packages'],
      keepUnusedDataFor: 60,
    }),
    packageDetail: builder.query<PackageSummary, string>({
      async queryFn(slug, queryApi) {
        try {
          return {
            data: await packagesApi.get(slug, queryApi.forced, queryApi.signal),
          };
        } catch (error) {
          return errorValue(error);
        }
      },
      providesTags: ['Packages'],
      keepUnusedDataFor: 300,
    }),
    generatePackage: builder.mutation<
      PackageSearchResponse,
      { packageType: string; documentLabels: string[] }
    >({
      async queryFn({ packageType, documentLabels }) {
        try {
          return {
            data: await packagesApi.searchOrGenerate(
              packageType,
              publicDocumentLabels(documentLabels),
            ),
          };
        } catch (error) {
          return errorValue(error);
        }
      },
    }),
  }),
});

export const {
  useBootstrapQuery,
  usePackagesQuery,
  usePackageDetailQuery,
  useGeneratePackageMutation,
} = api;
