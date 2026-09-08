import { publicDocumentLabels } from "../api/public-document-labels";
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
  return {
    error: {
      message: error instanceof Error ? error.message : 'Request failed.',
    },
  };
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<{ message: string }>(),
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
      async queryFn(query) {
        try {
          return { data: await packagesApi.list(query) };
        } catch (error) {
          return errorValue(error);
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.category ?? ''}:${queryArgs.search ?? ''}`,
      merge(current, incoming, { arg }) {
        if ((arg.page ?? 1) === 1) return incoming;
        const known = new Set(current.items.map(item => item.slug));
        current.items.push(
          ...incoming.items.filter(item => !known.has(item.slug)),
        );
        current.pagination = incoming.pagination;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        JSON.stringify(currentArg) !== JSON.stringify(previousArg),
      providesTags: ['Packages'],
      keepUnusedDataFor: 300,
    }),
    packageDetail: builder.query<PackageSummary, string>({
      async queryFn(slug) {
        try {
          return { data: await packagesApi.get(slug) };
        } catch (error) {
          return errorValue(error);
        }
      },
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
