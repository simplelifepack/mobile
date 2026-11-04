import { EmptyState } from '../../components/feedback/EmptyState';
import { PackageEditor } from './PackageEditor';
import { FileSystem } from 'react-native-file-access';
import {
  cleanupPickedDocuments,
  pickDocuments,
} from '../../native/documentFiles';
import { DetailSheet } from '../shared/DetailSheet';
import React from 'react';
import { mobileApi } from '../../api/mobile.api';
import type { AdminPackage } from '../../api/web.types';
import { openDownload } from '../../native/documentFiles';
import {
  FeaturePage,
  Stack,
  AppText,
  Button,
  TextInput,
  Details,
  Choice,
  ResourceStatus,
  useResource,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';
import { Card } from '../../components/primitives/Card';
export function PackageAdminScreen() {
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [editor, setEditor] = React.useState<{ existing?: AdminPackage }>();
  const [page, setPage] = React.useState(1);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [csv, setCsv] = React.useState('');
  const [preview, setPreview] =
    React.useState<
      Awaited<ReturnType<typeof mobileApi.adminPackages.previewCsv>>
    >();
  const resource = useResource(
    () =>
      mobileApi.adminPackages.list({
        search: query,
        page,
        category: category || undefined,
      }),
    [query, page, category],
  );
  const action = useAction(resource.refresh);
  const edit = async (item?: AdminPackage) => {
    setEditor({
      existing: item ? await mobileApi.adminPackages.get(item.slug) : undefined,
    });
  };
  return (
    <FeaturePage
      title="Package administration"
      subtitle="Maintain document checklists"
      actions={[
        {
          label: 'Create package',
          disabled: action.busy,
          onPress: () => {
            void action.run(() => edit(), '');
          },
        },
        {
          label: 'Import CSV',
          disabled: action.busy,
          onPress: () => setCsvOpen(true),
        },
        {
          label: 'Download CSV template',
          disabled: action.busy,
          onPress: () => {
            void action.run(
              async () =>
                openDownload(await mobileApi.adminPackages.downloadTemplate()),
              '',
            );
          },
        },
      ]}
    >
      <AppText color="secondary">
        Administrator access is verified by the backend.
      </AppText>
      <TextInput
        label="Search catalogue"
        value={search}
        onChangeText={setSearch}
      />
      <Button
        title="Search"
        onPress={() => {
          setQuery(search);
          setPage(1);
        }}
      />
      <Choice
        label="Category"
        value={category}
        options={[
          { label: 'All categories', value: '' },
          ...(resource.data?.categories ?? []).map(value => ({
            label: value,
            value,
          })),
        ]}
        onChange={value => {
          setCategory(value);
          setPage(1);
        }}
      />
      <ResourceStatus resource={resource} />
      {!resource.loading &&
      !resource.error &&
      resource.data?.items.length === 0 ? (
        <EmptyState
          title="No catalogue packages match"
          message="No saved packages match this search and category. Clear both to browse the catalogue."
          actionLabel="Clear search and category"
          onAction={() => {
            setSearch('');
            setQuery('');
            setCategory('');
            setPage(1);
          }}
        />
      ) : null}
      {resource.data?.items.map(item => (
        <Card key={item.slug}>
          <Stack>
            <AppText variant="heading">{item.title}</AppText>
            <AppText>
              {item.category} · version {item.version}
            </AppText>
            <Button
              title="Edit"
              disabled={action.busy}
              onPress={() => {
                void action.run(() => edit(item), '');
              }}
            />
            <Button
              title="Delete"
              variant="danger"
              disabled={action.busy}
              onPress={() =>
                confirmAction('Delete catalogue package?', () => {
                  void action.run(() =>
                    mobileApi.adminPackages.delete(item.slug),
                  );
                })
              }
            />
          </Stack>
        </Card>
      ))}
      {page > 1 ? (
        <Button
          title="Previous page"
          onPress={() => setPage(value => value - 1)}
        />
      ) : null}
      {resource.data?.pagination.hasNextPage ? (
        <Button title="Next page" onPress={() => setPage(value => value + 1)} />
      ) : null}
      {csvOpen ? (
        <DetailSheet title="Import CSV" onClose={() => setCsvOpen(false)}>
          <Button
            title="Choose CSV file"
            disabled={action.busy}
            onPress={() => {
              void action.run(async () => {
                const files = await pickDocuments();
                try {
                  if (!files.length) return;
                  if (files.length !== 1 || !/\.csv$/i.test(files[0].name))
                    throw new Error('Select one CSV file.');
                  if (files[0].size > 2 * 1024 * 1024)
                    throw new Error('CSV files must be 2 MB or smaller.');
                  const contents = (
                    await FileSystem.readFile(
                      files[0].uri.replace('file://', ''),
                      'utf8',
                    )
                  ).replace(/^\uFEFF/, '');
                  setCsv(contents);
                  setPreview(
                    await mobileApi.adminPackages.previewCsv(contents),
                  );
                } finally {
                  await cleanupPickedDocuments(files);
                }
              }, '');
            }}
          />
          <TextInput
            label="CSV contents"
            multiline
            value={csv}
            onChangeText={value => {
              setCsv(value);
              setPreview(undefined);
            }}
          />
          <Button
            title="Preview import"
            disabled={!csv || action.busy}
            onPress={() => {
              void action.run(
                async () =>
                  setPreview(await mobileApi.adminPackages.previewCsv(csv)),
                '',
              );
            }}
          />
          {preview ? (
            <>
              <Details value={preview} />
              <Button
                title="Apply reviewed CSV import"
                disabled={
                  action.busy ||
                  !preview.rows.length ||
                  preview.summary.invalid > 0
                }
                onPress={() =>
                  confirmAction(
                    'Import reviewed packages?',
                    () => {
                      void action.run(async () => {
                        const result =
                          await mobileApi.adminPackages.importCsv(csv);
                        if (result.failedCount)
                          throw new Error(
                            `${result.successCount} imported; ${result.failedCount} failed: ${result.results
                              .filter(row => row.status === 'failed')
                              .flatMap(row => row.errors)
                              .join(', ')}`,
                          );
                        setPreview(undefined);
                      });
                    },
                    'This updates the package catalogue using the CSV preview shown above.',
                  )
                }
              />
            </>
          ) : null}
          {action.message ? <AppText>{action.message}</AppText> : null}
        </DetailSheet>
      ) : null}
      {action.message ? <AppText>{action.message}</AppText> : null}
      {editor ? (
        <PackageEditor
          existing={editor.existing}
          onClose={() => setEditor(undefined)}
          onSaved={resource.refresh}
        />
      ) : null}
    </FeaturePage>
  );
}
