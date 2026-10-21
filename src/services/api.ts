import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { packagesApi, type PackageQuery } from '../api/packages.api';
import { documentsApi } from '../api/documents.api';
import { userApi } from '../api/user.api';
import type {
  BootstrapResponse,
  CustomPackPayload,
  DocumentRecord,
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
  tagTypes: ['Bootstrap', 'Documents', 'Packages', 'PackageDetail'],
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
    documents: builder.query<DocumentRecord[], void>({
      async queryFn() {
        try {
          return { data: await documentsApi.list() };
        } catch (error) {
          return errorValue(error);
        }
      },
      providesTags: ['Documents'],
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
      providesTags: (_result, _error, slug) => [
        { type: 'PackageDetail', id: slug },
      ],
      keepUnusedDataFor: 300,
    }),
    createCustomPackage: builder.mutation<PackageSummary, CustomPackPayload>({
      async queryFn(payload) {
        try {
          const result = await packagesApi.createCustom(payload);
          return { data: result.package };
        } catch (error) {
          return errorValue(error);
        }
      },
      invalidatesTags: ['Packages'],
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
              documentLabels,
            ),
          };
        } catch (error) {
          return errorValue(error);
        }
      },
    }),
    assignRequirementDocument: builder.mutation<
      PackageSummary,
      {
        assignmentSource: Exclude<
          import('../api/types').RequirementAssignmentSource,
          'AUTO'
        >;
        documentId: string;
        requirementId: string;
        slug: string;
      }
    >({
      async queryFn({ assignmentSource, documentId, requirementId, slug }) {
        try {
          const result = await packagesApi.assignRequirementDocument(
            slug,
            requirementId,
            documentId,
            assignmentSource,
          );
          return { data: result.package };
        } catch (error) {
          return errorValue(error);
        }
      },
      invalidatesTags: (_result, _error, { slug }) => [
        'Packages',
        { type: 'PackageDetail', id: slug },
      ],
    }),
    clearRequirementDocument: builder.mutation<
      PackageSummary,
      { requirementId: string; slug: string }
    >({
      async queryFn({ requirementId, slug }) {
        try {
          const result = await packagesApi.clearRequirementDocument(
            slug,
            requirementId,
          );
          return { data: result.package };
        } catch (error) {
          return errorValue(error);
        }
      },
      invalidatesTags: (_result, _error, { slug }) => [
        'Packages',
        { type: 'PackageDetail', id: slug },
      ],
    }),
  }),
});

export const {
  useBootstrapQuery,
  useDocumentsQuery,
  usePackagesQuery,
  usePackageDetailQuery,
  useCreateCustomPackageMutation,
  useGeneratePackageMutation,
  useAssignRequirementDocumentMutation,
  useClearRequirementDocumentMutation,
} = api;
