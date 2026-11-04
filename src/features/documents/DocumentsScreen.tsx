import { usePendingFiles } from '../shared/usePendingFiles';
import { Row } from '../../components/primitives/Row';
import { EmptyState } from '../../components/feedback/EmptyState';
import { DocumentDetailSheet } from './DocumentDetailSheet';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import * as DocumentDetailStyles from './documentDetail.styles';
import { DocumentContext } from './DocumentContext';
import { FileText, Image as ImageIcon, Camera } from 'lucide-react-native';
import { DocumentList, DocumentRow, DocumentToolbar } from './DocumentList';
import {
  filterDocuments,
  matchesQuickFilter,
  documentPerson,
  documentSource,
  sourceNames,
  type QuickFilter,
  type DocumentSort,
} from './documentFilters';
import { useAppSelector } from '../../app/store/hooks';
import { DetailSheet } from '../shared/DetailSheet';
import { DocumentImports } from './DocumentImports';
import React from 'react';
import { useRefreshOnFocus } from '../shared/useRefreshOnFocus';
import { Toggle as Switch } from '../../components/primitives/Toggle';
import { useAppDispatch } from '../../app/store/hooks';
import { api } from '../../services/api';
import { documentsApi } from '../../api/documents.api';
import type {
  AnalyzeDocumentResponse,
  DocumentRecord,
} from '../../api/web.types';
import {
  pickDocuments,
  pickGallery,
  openDownload,
  previewDownload,
  cleanupPickedDocuments,
} from '../../native/documentFiles';
import { DocumentScanner } from '../../native/documentScanner';
import { handleScannerPermissionError } from '../../native/documentScanner/permission';
import {
  FeaturePage,
  Stack,
  AppText,
  Button,
  Choice,
  Details,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
const categories = [
  'Identity',
  'Employment',
  'Finance',
  'Insurance',
  'Property',
  'Medical',
  'Education',
  'Travel',
  'Vehicle',
  'Legal',
  'Photo',
  'Other',
];
export function DocumentsScreen({
  route,
}: {
  route?: {
    params?: {
      documentId?: string;
      digilockerSession?: string;
      digilockerError?: string;
      scan?: boolean;
      uploadRequest?: number;
    };
  };
}) {
  const { theme } = useAppTheme();
  const [moreDetails, setMoreDetails] = React.useState(false);
  const library = useResource(documentsApi.list);
  useRefreshOnFocus(library.revalidate);
  const dispatch = useAppDispatch();
  const refresh = () => {
    library.refresh();
    dispatch(api.util.invalidateTags(['Bootstrap', 'Packages']));
  };
  const action = useAction(refresh);
  const pending = usePendingFiles();
  const [visibleCount, setVisibleCount] = React.useState(20);
  const currentUserName = useAppSelector(state => state.auth.user?.name);
  const [quick, setQuick] = React.useState<QuickFilter>('all');
  const [source, setSource] = React.useState('all');
  const [sort, setSort] = React.useState<DocumentSort>('newest');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [category, setCategory] = React.useState('All');
  const [owner, setOwner] = React.useState('All');
  const [selecting, setSelecting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detail, setDetail] = React.useState<DocumentRecord>();
  React.useEffect(() => setMoreDetails(false), [detail?.id]);
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const [importRequest, setImportRequest] = React.useState(0);
  const [aiConsent, setAiConsent] = React.useState(false);
  const [review, setReview] = React.useState<AnalyzeDocumentResponse>();
  React.useEffect(() => {
    if (route?.params?.documentId)
      void action.run(
        async () =>
          setDetail(await documentsApi.getById(route.params!.documentId!)),
        '',
      );
  }, [route?.params?.documentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const reviewForm = (analysis: AnalyzeDocumentResponse) => {
    const extracted = analysis.document;
    setReview(analysis);
    setForm({
      title: 'Review document before saving',
      fields: [
        {
          key: 'title',
          label: 'Document title',
          required: true,
          initial: extracted.title,
        },
        {
          key: 'category',
          label: 'Category',
          options: categories,
          initial: extracted.category,
        },
        {
          key: 'documentType',
          label: 'Document type',
          required: true,
          initial: extracted.documentType,
        },
        {
          key: 'owner',
          label: 'Owner',
          options: [
            'self',
            'spouse',
            'father',
            'mother',
            'child',
            'other',
            'unknown',
          ],
          initial: extracted.ownership === 'mine' ? 'self' : 'unknown',
        },
        {
          key: 'expiry',
          label: 'Expiry date',
          type: 'date',
          initial: extracted.expiryDate ?? '',
        },
        {
          key: 'duplicateAction',
          label: 'If duplicate found',
          options: ['fail', 'replace', 'keep_both'],
          initial: 'fail',
        },
        ...Object.entries(extracted.fields ?? {}).map(([key, value]) => ({
          key: `field:${key}`,
          label: key,
          initial: value,
        })),
      ],
      submit: async values => {
        const first = analysis.files[0];
        if (!first) throw new Error('No reviewed files available.');
        const fields = Object.fromEntries(
          Object.entries(values)
            .filter(([key]) => key.startsWith('field:'))
            .map(([key, value]) => [key.slice(6), value]),
        );
        await documentsApi.save({
          tempFileIds: analysis.files.map(file => file.tempFileId),
          originalName: first.originalName,
          mimeType: first.mimeType,
          size: analysis.files.reduce((sum, file) => sum + file.size, 0),
          title: values.title,
          category: values.category,
          documentType: values.documentType,
          confidence: 100,
          fields,
          reviewFields: [],
          rawExtractedText: extracted.extractedText ?? '',
          evidence: [],
          analysisSource: 'manual',
          owner: values.owner as 'self',
          expiry: values.expiry || null,
          userConfirmedUnknown: true,
          duplicateAction: values.duplicateAction as 'fail',
          verified: true,
        });
        setReview(undefined);
        refresh();
      },
    });
  };
  const upload = async (scan = false, gallery = false) => {
    let files;
    if (scan) {
      let result;
      try {
        result = await DocumentScanner.scan({
          pageLimit: 50,
          allowGalleryImport: true,
        });
      } catch (error) {
        if (handleScannerPermissionError(error)) return;
        throw error;
      }
      const { FileSystem } = await import('react-native-file-access');
      files = await Promise.all(
        result.pages.map(async page => ({
          uri: page.localPath.startsWith('file://')
            ? page.localPath
            : `file://${page.localPath}`,
          name: `scan-${page.pageNumber}.jpg`,
          type: page.mimeType,
          size: Number(
            (await FileSystem.stat(page.localPath.replace('file://', ''))).size,
          ),
        })),
      );
    } else files = gallery ? await pickGallery() : await pickDocuments();
    if (files.length) {
      try {
        reviewForm(await documentsApi.analyze(files, aiConsent));
      } finally {
        await cleanupPickedDocuments(files);
      }
    }
  };
  React.useEffect(() => {
    if (route?.params?.uploadRequest) void action.run(() => upload(), '');
    // A new request starts the existing encrypted upload flow once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.uploadRequest]);
  const shown = React.useMemo(
    () =>
      filterDocuments(library.data ?? [], {
        query: '',
        category: category.toLowerCase(),
        person: owner === 'All' ? 'all' : owner,
        source,
        sort,
        quick,
        currentUserName,
      }),
    [library.data, category, owner, source, sort, quick, currentUserName],
  );
  const quickFilters = [
    ['all', 'All'],
    ['soon', 'Expiring soon'],
    ['expired', 'Expired'],
    ['week', 'Added this week'],
    ['proofs', 'Proofs'],
  ] as const;
  return (
    <FeaturePage
      title="Documents"
      subtitle="Your important files, together"
      loading={library.loading && !library.data}
      refreshing={library.loading}
      actionTitle="Add documents"
      actions={[
        {
          label: 'Upload files',
          Icon: FileText,
          disabled: action.busy,
          onPress: () => {
            void action.run(() => upload(), '');
          },
        },
        {
          label: 'From gallery',
          Icon: ImageIcon,
          disabled: action.busy,
          onPress: () => {
            void action.run(() => upload(false, true), '');
          },
        },
        {
          label: 'Scan with camera',
          Icon: Camera,
          disabled: action.busy,
          onPress: () => {
            void action.run(() => upload(true), '');
          },
        },
      ]}
    >
      <ResourceStatus resource={library} showLoading={false} />
      {pending.files.length ? (
        <Button
          title="Retry selected files"
          disabled={action.busy}
          onPress={() => {
            void action.run(
              () =>
                pending.run(pending.files, async items => {
                  reviewForm(await documentsApi.analyze(items));
                }),
              '',
            );
          }}
        />
      ) : null}
      <DocumentImports
        hideTrigger
        returnSession={route?.params?.digilockerSession}
        returnError={route?.params?.digilockerError}
        openRequest={importRequest}
        onRefresh={refresh}
      />
      <Button
        title="Import from DigiLocker"
        variant="secondary"
        onPress={() => setImportRequest(value => value + 1)}
      />
      <DocumentToolbar
        count={shown.length}
        selecting={selecting}
        selectedCount={selectedIds.length}
        onSelect={() => {
          setSelecting(value => !value);
          setSelectedIds([]);
        }}
        onFilter={() => setFiltersOpen(true)}
      />
      {filtersOpen ? (
        <DetailSheet
          title="Filter and sort"
          onClose={() => setFiltersOpen(false)}
        >
          <Choice
            label="Quick filter"
            value={quick}
            options={quickFilters.map(([value, label]) => ({
              value,
              label: `${label} ${(library.data ?? []).filter(document => matchesQuickFilter(document, value)).length}`,
            }))}
            onChange={value => {
              setQuick(value as QuickFilter);
              setVisibleCount(20);
            }}
          />
          <Choice
            label="Category"
            value={category}
            options={['All', ...categories]}
            onChange={setCategory}
          />
          <Choice
            label="Person"
            value={owner}
            options={[
              'All',
              ...new Set(
                (library.data ?? []).map(document =>
                  documentPerson(document, currentUserName),
                ),
              ),
            ]}
            onChange={setOwner}
          />
          <Choice
            label="Source"
            value={source}
            options={[
              { label: 'All', value: 'all' },
              ...new Set((library.data ?? []).map(documentSource)),
            ].map(item =>
              typeof item === 'string'
                ? { label: sourceNames[item], value: item }
                : item,
            )}
            onChange={setSource}
          />
          <Choice
            label="Sort"
            value={sort}
            options={[
              { label: 'Newest first', value: 'newest' },
              { label: 'Oldest first', value: 'oldest' },
              { label: 'Name A–Z', value: 'name-asc' },
              { label: 'Name Z–A', value: 'name-desc' },
            ]}
            onChange={value => setSort(value as DocumentSort)}
          />
          <Row align="center" justify="space-between">
            <AppText variant="caption" color="muted">
              Allow AI to analyze uploads
            </AppText>
            <Switch
              accessibilityLabel="Allow AI document analysis"
              value={aiConsent}
              onValueChange={setAiConsent}
            />
          </Row>

          <Button title="Apply filters" onPress={() => setFiltersOpen(false)} />
          <Button
            title="Reset filters"
            variant="ghost"
            onPress={() => {
              setCategory('All');
              setOwner('All');
              setSource('all');
              setSort('newest');
              setQuick('all');
            }}
          />
        </DetailSheet>
      ) : null}
      {review ? (
        <>
          <AppText>
            {review.warnings.map(warning => warning.message).join('\n')}
          </AppText>
          <Button
            title="Continue upload review"
            onPress={() => reviewForm(review)}
          />
        </>
      ) : null}
      {action.message ? <AppText>{action.message}</AppText> : null}
      {selectedIds.length ? (
        <>
          <AppText>{selectedIds.length} selected</AppText>
          <Button
            title="Download selected"
            disabled={action.busy}
            onPress={() => {
              void action.run(
                async () =>
                  openDownload(await documentsApi.bulkDownload(selectedIds)),
                '',
              );
            }}
          />
          <Button
            title="Assign selected"
            disabled={action.busy}
            variant="secondary"
            onPress={() => {
              void action.run(async () => {
                const options = await documentsApi.assignmentOptions();
                setForm({
                  title: 'Assign documents',
                  fields: [
                    {
                      key: 'assignee',
                      label: 'Assign to',
                      required: true,
                      options: options.map(item => ({
                        label: item.name,
                        value: item.id,
                      })),
                    },
                  ],
                  submit: async values => {
                    await documentsApi.bulkAssign(selectedIds, values.assignee);
                    setSelectedIds([]);
                    refresh();
                  },
                });
              }, '');
            }}
          />
          <Button
            title="Delete selected"
            disabled={action.busy}
            variant="danger"
            onPress={() =>
              confirmAction('Delete selected documents?', () => {
                void action.run(async () => {
                  await documentsApi.bulkDelete(selectedIds);
                  setSelectedIds([]);
                  setDetail(undefined);
                });
              })
            }
          />
          <Button
            title="Clear selection"
            variant="ghost"
            onPress={() => setSelectedIds([])}
          />
        </>
      ) : null}
      {!library.loading && !library.error && shown.length === 0 ? (
        <EmptyState
          title={
            library.data?.length
              ? 'No documents match these filters'
              : 'Your document archive is empty'
          }
          message={
            library.data?.length
              ? 'Your files are still in the archive. Reset the filters to see them.'
              : 'No files have been added to this account yet. Add your first document to begin.'
          }
          actionLabel={
            library.data?.length ? 'Reset filters' : 'Add a document'
          }
          onAction={() => {
            if (library.data?.length) {
              setQuick('all');
              setCategory('All');
              setOwner('All');
              setSource('all');
            } else {
              void action.run(() => upload(), '');
            }
          }}
        />
      ) : null}
      {shown.length ? (
        <DocumentList>
          {shown.slice(0, visibleCount).map((document, index, visible) => (
            <DocumentRow
              key={document.id}
              document={document}
              currentUserName={currentUserName}
              selecting={selecting}
              selected={selectedIds.includes(document.id)}
              last={index === visible.length - 1}
              disabled={action.busy}
              onPress={() => {
                if (selecting)
                  setSelectedIds(ids =>
                    ids.includes(document.id)
                      ? ids.filter(id => id !== document.id)
                      : [...ids, document.id],
                  );
                else {
                  setDetail(document);
                  void documentsApi
                    .getById(document.id)
                    .then(fresh =>
                      setDetail(current =>
                        current?.id === document.id ? fresh : current,
                      ),
                    )
                    .catch(() => undefined);
                }
              }}
            />
          ))}
        </DocumentList>
      ) : null}
      {(shown?.length ?? 0) > visibleCount ? (
        <Button
          title="Load more documents"
          variant="secondary"
          onPress={() => setVisibleCount(count => count + 20)}
        />
      ) : null}
      {detail ? (
        <DocumentDetailSheet
          document={detail}
          busy={action.busy}
          feedback={action.message || undefined}
          onClose={() => {
            setDetail(undefined);
            setMoreDetails(false);
          }}
          onPreview={() => {
            void action.run(
              async () =>
                previewDownload(await documentsApi.preview(detail.id)),
              '',
            );
          }}
          onDelete={() =>
            confirmAction('Delete document?', () => {
              void action.run(async () => {
                await documentsApi.delete(detail.id);
                setDetail(undefined);
              });
            })
          }
        >
          <DocumentContext
            document={detail}
            onChanged={document => {
              setDetail(current =>
                current?.id === document.id ? document : current,
              );
              refresh();
            }}
            onClose={() => setDetail(undefined)}
            expiryControl={
              <DocumentDetailStyles.Section>
                <AppText variant="label">Expiry</AppText>
                <DocumentDetailStyles.Control
                  accessibilityRole="button"
                  accessibilityLabel="Change document expiry"
                  accessibilityValue={{
                    text: detail.expiryDate?.slice(0, 10) || 'Not set',
                  }}
                  disabled={action.busy}
                  onPress={() =>
                    setForm({
                      title: 'Expiry',
                      fields: [
                        {
                          key: 'expiry',
                          label: 'Expiry date',
                          type: 'date',
                          initial: detail.expiryDate?.slice(0, 10) || '',
                        },
                      ],
                      submit: async values => {
                        const result = await documentsApi.updateDetails(
                          detail.id,
                          { expiry: values.expiry || null },
                        );
                        setDetail(result.document);
                        refresh();
                      },
                    })
                  }
                >
                  <DocumentDetailStyles.Copy>
                    <AppText color={detail.expiryDate ? 'primary' : 'muted'}>
                      {detail.expiryDate
                        ? detail.expiryDate
                            .slice(0, 10)
                            .split('-')
                            .reverse()
                            .join('/')
                        : 'dd/mm/yyyy'}
                    </AppText>
                  </DocumentDetailStyles.Copy>
                  <Calendar size={18} color={theme.colors.textSecondary} />
                </DocumentDetailStyles.Control>
              </DocumentDetailStyles.Section>
            }
          />
          <DocumentDetailStyles.Section>
            <AppText variant="label">Notes</AppText>
            <AppText color="secondary">
              {String(
                (detail.fields as Record<string, unknown>)?.documentNotes ||
                  (detail.fields as Record<string, unknown>)?.notes ||
                  'No notes added.',
              )}
            </AppText>
            <Button
              title="Edit notes"
              variant="ghost"
              onPress={() =>
                setForm({
                  title: 'Notes',
                  fields: [
                    {
                      key: 'notes',
                      label: 'Notes',
                      type: 'multiline',
                      initial: String(
                        (detail.fields as Record<string, unknown>)
                          ?.documentNotes ||
                          (detail.fields as Record<string, unknown>)?.notes ||
                          '',
                      ),
                    },
                  ],
                  submit: async values => {
                    const result = await documentsApi.updateDetails(detail.id, {
                      notes: values.notes,
                    });
                    setDetail(result.document);
                    refresh();
                  },
                })
              }
            />
          </DocumentDetailStyles.Section>
          <DocumentDetailStyles.More
            accessibilityRole="button"
            accessibilityState={{ expanded: moreDetails }}
            onPress={() => setMoreDetails(!moreDetails)}
          >
            <AppText variant="label">Pages and extracted details</AppText>
            <ChevronDown size={18} color={theme.colors.textMuted} />
          </DocumentDetailStyles.More>
          {moreDetails ? (
            <Stack>
              <Details value={detail.fields} />
              <Button
                title="Edit notes and expiry"
                variant="secondary"
                onPress={() =>
                  setForm({
                    title: 'Edit document',
                    fields: [
                      {
                        key: 'notes',
                        label: 'Notes',
                        initial: String(
                          (detail.fields as Record<string, unknown>)
                            ?.documentNotes ??
                            (detail.fields as Record<string, unknown>)?.notes ??
                            '',
                        ),
                      },
                      {
                        key: 'expiry',
                        label: 'Expiry date',
                        type: 'date',
                        initial: detail.expiryDate?.slice(0, 10) ?? '',
                      },
                    ],
                    submit: async values => {
                      const result = await documentsApi.updateDetails(
                        detail.id,
                        {
                          notes: values.notes,
                          expiry: values.expiry || null,
                        },
                      );
                      setDetail(result.document);
                      refresh();
                    },
                  })
                }
              />
              <Button
                title="Add pages"
                variant="secondary"
                disabled={action.busy}
                onPress={() => {
                  void action.run(async () => {
                    const files = await pickDocuments();
                    if (files.length) {
                      const result = await documentsApi.addPageFiles(
                        detail.id,
                        files,
                      );
                      setDetail(result.document);
                    }
                  });
                }}
              />
              {detail.pages?.map((page, index) => (
                <Stack key={page.id}>
                  <AppText>
                    {index + 1}. {page.label || page.originalName}
                  </AppText>
                  <Button
                    title="Open page"
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() => {
                      void action.run(
                        async () =>
                          previewDownload(
                            await documentsApi.downloadPage(detail.id, page.id),
                          ),
                        '',
                      );
                    }}
                  />
                  {index > 0 ? (
                    <Button
                      title="Move page up"
                      variant="ghost"
                      disabled={action.busy}
                      onPress={() => {
                        void action.run(async () => {
                          const ids = detail.pages!.map(item => item.id);
                          [ids[index - 1], ids[index]] = [
                            ids[index],
                            ids[index - 1],
                          ];
                          setDetail(
                            (await documentsApi.reorderPages(detail.id, ids))
                              .document,
                          );
                        });
                      }}
                    />
                  ) : null}
                  <Button
                    title="Replace page"
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() => {
                      void action.run(async () => {
                        const files = await pickDocuments();
                        if (!files.length) return;
                        if (files.length !== 1)
                          throw new Error('Select one replacement file.');
                        const analysis = await documentsApi.analyze(files);
                        if (!analysis.files[0])
                          throw new Error(
                            'Unable to prepare the replacement page.',
                          );
                        setDetail(
                          (
                            await documentsApi.replacePage(
                              detail.id,
                              page.id,
                              analysis.files[0].tempFileId,
                            )
                          ).document,
                        );
                        refresh();
                      }, '');
                    }}
                  />
                  <Button
                    title="Delete page"
                    variant="danger"
                    disabled={action.busy}
                    onPress={() =>
                      confirmAction('Delete page?', () => {
                        void action.run(async () =>
                          setDetail(
                            (await documentsApi.deletePage(detail.id, page.id))
                              .document,
                          ),
                        );
                      })
                    }
                  />
                </Stack>
              ))}
            </Stack>
          ) : null}
          <ActiveForm form={form} onClose={() => setForm(null)} />
        </DocumentDetailSheet>
      ) : null}
      {!detail ? (
        <ActiveForm form={form} onClose={() => setForm(null)} />
      ) : null}
    </FeaturePage>
  );
}
