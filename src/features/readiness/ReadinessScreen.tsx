import { packageDownloadIds } from './packageDownload';
import { UploadDocumentSheet } from '../documents/UploadDocumentSheet';
import { PackageRow } from './PackageRow';
import { PackageListSkeleton } from './PackageListSkeleton';
import { documentsApi } from '../../api/documents.api';
import { openDownload, previewDownload } from '../../native/documentFiles';
import { SectionTabs } from '../shared/SectionTabs';
import { FeaturePage } from '../shared/FeatureUI';
import { PackageDetailSheet } from './PackageDetailSheet';
import React, { useMemo, useState } from 'react';
import { Share } from 'react-native';
import {
  useBootstrapQuery,
  useGeneratePackageMutation,
  usePackageDetailQuery,
  usePackagesQuery,
} from '../../services/api';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { calculatePackReadiness } from './calculatePackReadiness';
import type { PackageSummary } from '../../api/types';
import { mobileApi } from '../../api/mobile.api';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { api } from '../../services/api';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
import { exportTextPdf } from '../../native/documentFiles';
import { useAction, confirmAction } from '../shared/FeatureUI';
import { CustomPackage } from './CustomPackage';

const categories = [
  'All',
  'My packs',
  'Travel & Immigration',
  'Identity & Civic',
  'Money & Tax',
  'Jobs & Employment',
  'Education',
  'Health',
  'Home & Property',
  'Family & Life',
];
function errorMessage(error: unknown) {
  const value = error as { message?: string; error?: string };
  return value?.message ?? value?.error ?? 'Unable to load packages.';
}

export function ReadinessScreen({
  route,
}: {
  route?: {
    params?: { slug?: string; query?: string; createRequest?: number };
  };
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const action = useAction(() =>
    dispatch(api.util.invalidateTags(['Packages'])),
  );
  const [form, setForm] = useState<FormConfig | null>(null);
  const [createRequest, setCreateRequest] = useState(
    route?.params?.createRequest ?? 0,
  );
  React.useEffect(() => {
    if (route?.params?.createRequest)
      setCreateRequest(route.params.createRequest);
  }, [route?.params?.createRequest]);
  const [researchRequest, setResearchRequest] = useState(0);
  const [submittedQuery, setSubmittedQuery] = useState(
    route?.params?.query ?? '',
  );
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(
    route?.params?.slug,
  );
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  React.useEffect(() => {
    setSkippedIds([]);
    setExcludedIds([]);
    setUploadFor(null);
  }, [selectedSlug]);
  const [extraDownloadIds, setExtraDownloadIds] = useState<string[]>([]);
  React.useEffect(() => setExtraDownloadIds([]), [selectedSlug]);
  const [generated, setGenerated] = useState<PackageSummary | null>(null);
  React.useEffect(() => {
    if (route?.params?.slug) setSelectedSlug(route.params.slug);
    if (route?.params?.query !== undefined) {
      setSubmittedQuery(route.params.query);
      setPage(1);
    }
    setGenerated(null);
  }, [route?.params?.slug, route?.params?.query]);
  const updatePackage = (pack: PackageSummary) => {
    setGenerated(pack);
    dispatch(api.util.upsertQueryData('packageDetail', pack.slug, pack));
    dispatch(api.util.invalidateTags(['Packages']));
  };

  const packageQuery = {
    category: category === 'All' ? undefined : category,
    search: submittedQuery || undefined,
    page,
    limit: 20,
  };
  const packages = usePackagesQuery(packageQuery, {
    refetchOnMountOrArgChange: 60,
  });
  const bootstrap = useBootstrapQuery();
  const detail = usePackageDetailQuery(selectedSlug!, {
    skip: !selectedSlug,
    refetchOnMountOrArgChange: 60,
  });
  const [generate, generation] = useGeneratePackageMutation();
  const documents = useMemo(
    () => bootstrap.data?.documents ?? [],
    [bootstrap.data?.documents],
  );
  const catalogueKey = JSON.stringify([category, submittedQuery]);
  const [loadedPages, setLoadedPages] = useState<{
    key: string;
    pages: Record<number, PackageSummary[]>;
  }>({ key: '', pages: {} });
  React.useEffect(() => {
    if (!packages.currentData) return;
    const incoming = packages.currentData.items;
    setLoadedPages(current => ({
      key: catalogueKey,
      pages: {
        ...(current.key === catalogueKey ? current.pages : {}),
        [page]: incoming,
      },
    }));
  }, [catalogueKey, page, packages.currentData]);
  const items = useMemo(() => {
    if (generated) return [generated];
    const pages = loadedPages.key === catalogueKey ? loadedPages.pages : {};
    const collected = Object.entries(pages)
      .filter(([number]) => Number(number) <= page)
      .sort(([a], [b]) => Number(a) - Number(b))
      .flatMap(([, values]) => values);
    return [
      ...new Map(
        [...collected, ...(packages.currentData?.items ?? [])].map(item => [
          item.slug,
          item,
        ]),
      ).values(),
    ];
  }, [generated, catalogueKey, loadedPages, page, packages.currentData]);
  const cards = useMemo(
    () =>
      items.map(item => ({
        item,
        readiness: calculatePackReadiness(item.requirements, documents),
      })),
    [documents, items],
  );
  const showPackageSkeleton =
    packages.isLoading ||
    (packages.isFetching && page === 1) ||
    bootstrap.isLoading;
  const selected = selectedSlug
    ? ((generated?.slug === selectedSlug ? generated : undefined) ??
      detail.currentData ??
      items.find(item => item.slug === selectedSlug))
    : undefined;
  const selectedReadiness = useMemo(
    () =>
      selected
        ? calculatePackReadiness(selected.requirements, documents)
        : null,
    [selected, documents],
  );
  const generateMissing = async () => {
    const result = await generate({
      packageType: submittedQuery,
      documentLabels: documents.map(
        document => document.normalizedType ?? document.documentType,
      ),
    }).unwrap();
    updatePackage(result.package);
    setSelectedSlug(result.package.slug);
  };
  return (
    <FeaturePage
      title="Packages"
      subtitle="Know what’s ready and missing"
      onActionPress={() => setResearchRequest(value => value + 1)}
      description={
        !showPackageSkeleton && packages.currentData
          ? `${packages.currentData.pagination.total} packages matched to your archive.`
          : undefined
      }
    >
      <CustomPackage
        hideTrigger
        createRequest={createRequest}
        researchRequest={researchRequest}
        onSaved={pack => {
          setGenerated(pack);
          setSelectedSlug(pack.slug);
          dispatch(api.util.invalidateTags(['Packages']));
        }}
      />
      {action.message ? <AppText>{action.message}</AppText> : null}
      <SectionTabs
        label="Package categories"
        value={category}
        options={categories}
        onChange={value => {
          setCategory(value);
          setPage(1);
          setGenerated(null);
        }}
      />
      {submittedQuery ? (
        <Button
          title="Show all packages"
          variant="ghost"
          onPress={() => {
            setSubmittedQuery('');
            setPage(1);
            setGenerated(null);
          }}
        />
      ) : null}

      {(packages.error && packages.data) ||
      (bootstrap.error && bootstrap.data) ? (
        <ErrorState
          error={packages.error ?? bootstrap.error}
          onRetry={() => {
            packages.refetch();
            bootstrap.refetch();
          }}
        />
      ) : null}
      {showPackageSkeleton ? (
        <PackageListSkeleton />
      ) : (packages.error && !packages.data) ||
        (bootstrap.error && !bootstrap.data) ? (
        <Stack gap="md">
          <ErrorState error={packages.error ?? bootstrap.error} />
          <Button
            title="Retry"
            onPress={() => {
              packages.refetch();
              bootstrap.refetch();
            }}
          />
        </Stack>
      ) : cards.length === 0 ? (
        <Stack gap="md">
          <EmptyState
            title="No matching packages"
            message={
              submittedQuery
                ? `No package currently matches “${submittedQuery}”. Try a shorter phrase or show all packages.`
                : 'This category has no saved packages. Choose All to browse the catalogue.'
            }
            actionLabel="Show all packages"
            onAction={() => {
              setSubmittedQuery('');
              setCategory('All');
              setPage(1);
            }}
          />
          {packages.data?.canGenerate && submittedQuery ? (
            <Button
              title={
                generation.isLoading
                  ? 'Searching official sources…'
                  : 'Search official sources'
              }
              disabled={generation.isLoading}
              onPress={() => {
                void action.run(generateMissing, '');
              }}
            />
          ) : null}
          {generation.error ? (
            <AppText color="danger">{errorMessage(generation.error)}</AppText>
          ) : null}
        </Stack>
      ) : (
        <Stack gap="sm">
          {cards.map(({ item, readiness }, index) => (
            <React.Fragment key={item.slug}>
              {(!index || cards[index - 1].item.category !== item.category) &&
              !submittedQuery ? (
                <AppText variant="label">{item.category}</AppText>
              ) : null}
              <PackageRow
                title={item.title}
                percentage={readiness.percentage}
                ready={readiness.satisfiedRequired}
                total={readiness.totalRequired}
                onPress={() => setSelectedSlug(item.slug)}
              />
            </React.Fragment>
          ))}
          {packages.data?.pagination.hasNextPage ? (
            <Button
              title="Load more"
              disabled={packages.isFetching}
              variant="secondary"
              onPress={() => setPage(value => value + 1)}
            />
          ) : null}
        </Stack>
      )}
      {selected && selectedReadiness ? (
        <PackageDetailSheet
          key={selected.slug}
          pack={selected}
          readiness={selectedReadiness}
          documents={documents}
          busy={action.busy}
          feedback={action.message || undefined}
          skippedIds={skippedIds}
          extraIds={extraDownloadIds}
          includedIds={packageDownloadIds(
            selectedReadiness.requirements,
            extraDownloadIds,
            excludedIds,
            skippedIds,
          )}
          onClose={() => setSelectedSlug(undefined)}
          onRefresh={() => {
            void action.run(async () => {
              const result = await mobileApi.packages.refresh(selected.slug);
              updatePackage(result.package);
            }, 'Requirements checked.');
          }}
          onSkip={id =>
            setSkippedIds(ids =>
              ids.includes(id)
                ? ids.filter(value => value !== id)
                : [...ids, id],
            )
          }
          onUpload={setUploadFor}
          onView={document => {
            void action.run(
              async () =>
                previewDownload(await documentsApi.preview(document.id)),
              '',
            );
          }}
          onAssign={requirement =>
            setForm({
              title: `Replace: ${requirement.title}`,
              fields: [
                {
                  key: 'documentId',
                  label: 'Document',
                  required: true,
                  initial: requirement.matchedDocument?.id,
                  options: documents.map(document => ({
                    label: document.displayName || document.originalName,
                    value: document.id,
                  })),
                },
                {
                  key: 'assignmentSource',
                  label: 'Assignment',
                  options: ['USER_SELECTED', 'USER_OVERRIDE'],
                  initial: 'USER_SELECTED',
                },
              ],
              submit: async values => {
                const result =
                  await mobileApi.packages.assignRequirementDocument(
                    selected.slug,
                    requirement.id,
                    {
                      documentId: values.documentId,
                      assignmentSource: values.assignmentSource as
                        'USER_SELECTED' | 'USER_OVERRIDE',
                    },
                  );
                updatePackage(result.package);
              },
            })
          }
          onClear={requirement => {
            void action.run(async () => {
              const result = await mobileApi.packages.clearRequirementDocument(
                selected.slug,
                requirement.id,
              );
              updatePackage(result.package);
            });
          }}
          onToggleDocument={id => {
            const matched = selectedReadiness.requirements.some(
              r =>
                r.status === 'ready' &&
                r.matchedDocument?.id === id &&
                !skippedIds.includes(r.id),
            );
            if (matched || extraDownloadIds.includes(id))
              setExcludedIds(ids =>
                ids.includes(id)
                  ? ids.filter(value => value !== id)
                  : [...ids, id],
              );
            else {
              setExtraDownloadIds(ids => [...ids, id]);
              setExcludedIds(ids => ids.filter(value => value !== id));
            }
          }}
          onDownload={() => {
            const ids = packageDownloadIds(
              selectedReadiness.requirements,
              extraDownloadIds,
              excludedIds,
              skippedIds,
            );
            void action.run(
              async () => openDownload(await documentsApi.bulkDownload(ids)),
              '',
            );
          }}
          onShare={() => {
            void action.run(
              () =>
                Share.share({
                  title: selected.title,
                  message: `${selected.title}\n${selected.description}\n\n${selectedReadiness.requirements.map(item => `${item.status === 'ready' ? '✓' : '○'} ${item.title}${item.required ? ' (required)' : ''}`).join('\n')}${selected.source?.url ? `\n\nSource: ${selected.source.url}` : ''}`,
                }),
              '',
            );
          }}
          onExport={() => {
            void action.run(
              () =>
                exportTextPdf(
                  selected.title,
                  `${selected.description}\n\n${selectedReadiness.requirements.map(item => `${item.status === 'ready' ? '[Ready]' : '[Missing]'} ${item.title}${item.required ? ' (required)' : ''}`).join('\n')}`,
                ),
              '',
            );
          }}
          tools={
            <>
              {selected.createdBy === user?.id ? (
                <>
                  <Button
                    title="Edit custom package"
                    onPress={() =>
                      setForm({
                        title: 'Edit custom package',
                        fields: [
                          {
                            key: 'title',
                            label: 'Title',
                            required: true,
                            initial: selected.title,
                          },
                          {
                            key: 'description',
                            label: 'Description',
                            initial: selected.description,
                          },
                          {
                            key: 'requirements',
                            label: 'Requirements (one per line)',
                            type: 'multiline',
                            required: true,
                            initial: selected.requirements
                              .map(item => item.title)
                              .join('\n'),
                          },
                        ],
                        submit: async values => {
                          const result = await mobileApi.packages.updateCustom(
                            selected.slug,
                            {
                              title: values.title,
                              description: values.description,
                              requirements: values.requirements
                                .split('\n')
                                .map(item => item.trim())
                                .filter(Boolean),
                            },
                          );
                          updatePackage(result.package);
                          dispatch(api.util.invalidateTags(['Packages']));
                        },
                      })
                    }
                  />
                  <Button
                    title="Delete custom package"
                    variant="danger"
                    disabled={action.busy}
                    onPress={() =>
                      confirmAction('Delete custom package?', () => {
                        void action.run(async () => {
                          await mobileApi.packages.deleteCustom(selected.slug);
                          setSelectedSlug(undefined);
                          setGenerated(null);
                        });
                      })
                    }
                  />
                </>
              ) : null}
            </>
          }
        >
          {uploadFor ? (
            <UploadDocumentSheet
              onClose={() => setUploadFor(null)}
              onSaved={async document => {
                dispatch(api.util.invalidateTags(['Bootstrap']));
                if (uploadFor === 'extra')
                  setExtraDownloadIds(ids => [
                    ...new Set([...ids, document.id]),
                  ]);
                else {
                  const result =
                    await mobileApi.packages.assignRequirementDocument(
                      selected.slug,
                      uploadFor,
                      {
                        documentId: document.id,
                        assignmentSource: 'USER_SELECTED',
                      },
                    );
                  updatePackage(result.package);
                }
              }}
            />
          ) : null}
          <ActiveForm form={form} onClose={() => setForm(null)} />
        </PackageDetailSheet>
      ) : detail.isFetching ? (
        <LoadingState label="Loading package details…" />
      ) : detail.error ? (
        <ErrorState message={errorMessage(detail.error)} />
      ) : null}
      {!selected ? (
        <ActiveForm form={form} onClose={() => setForm(null)} />
      ) : null}
    </FeaturePage>
  );
}
