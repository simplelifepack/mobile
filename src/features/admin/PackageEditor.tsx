import React from 'react';
import { mobileApi } from '../../api/mobile.api';
import type {
  AdminPackage,
  AdminPackagePayload,
  AdminPackageRequirement,
  AdminPackageSource,
} from '../../api/web.types';
import { DetailSheet } from '../shared/DetailSheet';
import {
  ActiveForm,
  type FormConfig,
  type FormField,
} from '../shared/RecordForm';
import {
  AppText,
  Button,
  Stack,
  useAction,
  confirmAction,
} from '../shared/FeatureUI';

const list = (value: string) =>
  value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
export function PackageEditor({
  existing,
  onClose,
  onSaved,
}: {
  existing?: AdminPackage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = React.useState<AdminPackagePayload>(() => ({
    title: existing?.title ?? '',
    slug: existing?.slug,
    category: existing?.category ?? '',
    description: existing?.description ?? '',
    aliases: existing?.aliases ?? [],
    keywords: existing?.keywords ?? [],
    country:
      typeof existing?.searchMetadata?.country === 'string'
        ? existing.searchMetadata.country
        : '',
    applicability:
      typeof existing?.searchMetadata?.applicability === 'string'
        ? existing.searchMetadata.applicability
        : '',
    subtitle: existing?.subtitle,
    sourceName: existing?.sourceName,
    sourceTitle: existing?.sourceTitle,
    sourceType: existing?.sourceType,
    sourceUrl: existing?.sourceUrl,
    lastCheckedAt: existing?.lastCheckedAt,
    lastVerifiedAt: existing?.lastVerifiedAt,
    verificationStatus: existing?.verificationStatus,
    searchMetadata: existing?.searchMetadata ?? undefined,
    requirements: existing?.requirements ?? [],
    sources: existing?.verificationSources ?? [],
  }));
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const action = useAction();
  const basic = () => {
    const fields: FormField[] = [
      { key: 'title', label: 'Package name', required: true },
      { key: 'slug', label: 'Slug' },
      { key: 'category', label: 'Category', required: true },
      {
        key: 'description',
        label: 'Description',
        required: true,
        type: 'multiline',
      },
      { key: 'subtitle', label: 'Subtitle' },
      { key: 'country', label: 'Country' },
      { key: 'applicability', label: 'Applicability' },
      { key: 'sourceName', label: 'Primary source name' },
      { key: 'sourceTitle', label: 'Primary source title' },
      { key: 'sourceType', label: 'Primary source type' },
      { key: 'sourceUrl', label: 'Primary source URL' },
      { key: 'lastCheckedAt', label: 'Last checked', type: 'date' },
      { key: 'lastVerifiedAt', label: 'Last verified', type: 'date' },
      { key: 'verificationStatus', label: 'Verification status' },
    ];
    setForm({
      title: 'Package details',
      fields: [
        ...fields.map(field => ({
          ...field,
          initial: String(
            draft[field.key as keyof AdminPackagePayload] ?? '',
          ).slice(0, field.type === 'date' ? 10 : undefined),
        })),
        {
          key: 'aliases',
          label: 'Aliases (one per line)',
          type: 'multiline',
          initial: draft.aliases.join('\n'),
        },
        {
          key: 'keywords',
          label: 'Keywords (one per line)',
          type: 'multiline',
          initial: draft.keywords.join('\n'),
        },
      ],
      submit: async values => {
        if (values.sourceUrl && !/^https?:\/\//i.test(values.sourceUrl))
          throw new Error('Use an HTTP or HTTPS source URL.');
        setDraft(current => ({
          ...current,
          ...Object.fromEntries(
            fields.map(field => [
              field.key,
              values[field.key] || (field.type === 'date' ? null : ''),
            ]),
          ),
          aliases: list(values.aliases),
          keywords: list(values.keywords),
        }));
      },
    });
  };
  const requirement = (index?: number) => {
    const current = index == null ? undefined : draft.requirements[index];
    setForm({
      title: current ? 'Edit requirement' : 'Add requirement',
      fields: [
        {
          key: 'title',
          label: 'Title',
          required: true,
          initial: current?.title,
        },
        {
          key: 'group',
          label: 'Group',
          required: true,
          initial: current?.group ?? 'documents',
        },
        {
          key: 'owner',
          label: 'Owner',
          required: true,
          initial: current?.owner ?? 'self',
        },
        {
          key: 'documentType',
          label: 'Document type',
          initial: current?.documentType,
        },
        {
          key: 'description',
          label: 'Description',
          type: 'multiline',
          initial: current?.description,
        },
        {
          key: 'required',
          label: 'Required',
          options: ['yes', 'no'],
          initial: current?.required === false ? 'no' : 'yes',
        },
        {
          key: 'accepted',
          label: 'Accepted document types (one per line)',
          type: 'multiline',
          required: true,
          initial: current?.acceptedDocumentTypes.join('\n'),
        },
        {
          key: 'alternatives',
          label: 'Alternative labels (one per line)',
          type: 'multiline',
          initial: current?.alternativeLabels.join('\n'),
        },
      ],
      submit: async values => {
        const item: AdminPackageRequirement = {
          ...current,
          title: values.title,
          group: values.group,
          owner: values.owner,
          documentType: values.documentType,
          description: values.description,
          required: values.required === 'yes',
          acceptedDocumentTypes: list(values.accepted),
          alternativeLabels: list(values.alternatives),
        };
        setDraft(value => ({
          ...value,
          requirements:
            index == null
              ? [...value.requirements, item]
              : value.requirements.map((row, i) => (i === index ? item : row)),
        }));
      },
    });
  };
  const source = (index?: number) => {
    const current = index == null ? undefined : draft.sources[index];
    setForm({
      title: current ? 'Edit source' : 'Add source',
      fields: [
        {
          key: 'title',
          label: 'Display name',
          required: true,
          initial: current?.title,
        },
        { key: 'url', label: 'URL', required: true, initial: current?.url },
        {
          key: 'organization',
          label: 'Organization',
          initial: current?.organization ?? current?.name,
        },
        { key: 'type', label: 'Type', initial: current?.type ?? 'official' },
      ],
      submit: async values => {
        if (!/^https?:\/\//i.test(values.url))
          throw new Error('Use an HTTP or HTTPS source URL.');
        const item: AdminPackageSource = {
          ...current,
          title: values.title,
          url: values.url,
          name: values.organization,
          organization: values.organization,
          type: values.type,
        };
        setDraft(value => ({
          ...value,
          sources:
            index == null
              ? [...value.sources, item]
              : value.sources.map((row, i) => (i === index ? item : row)),
        }));
      },
    });
  };
  return (
    <DetailSheet
      title={existing ? 'Edit catalogue package' : 'Create catalogue package'}
      onClose={onClose}
      busy={action.busy}
    >
      <AppText variant="heading">{draft.title || 'Untitled package'}</AppText>
      <AppText>
        {draft.category} · {draft.description}
      </AppText>
      <Button
        title="Edit package details"
        disabled={action.busy}
        onPress={basic}
      />
      <AppText variant="heading">Requirements</AppText>
      {draft.requirements.map((item, index) => (
        <Stack key={item.id ?? index}>
          <AppText>
            {item.title} · {item.required ? 'Required' : 'Optional'}
          </AppText>
          <Button
            title={`Edit requirement ${index + 1}`}
            variant="secondary"
            disabled={action.busy}
            onPress={() => requirement(index)}
          />
          <Button
            title={`Remove requirement ${index + 1}`}
            variant="danger"
            disabled={action.busy}
            onPress={() =>
              setDraft(value => ({
                ...value,
                requirements: value.requirements.filter((_, i) => i !== index),
              }))
            }
          />
        </Stack>
      ))}
      <Button
        title="Add requirement"
        disabled={action.busy}
        onPress={() => requirement()}
      />
      <AppText variant="heading">Sources</AppText>
      {draft.sources.map((item, index) => (
        <Stack key={index}>
          <AppText>
            {item.title} · {item.url}
          </AppText>
          <Button
            title={`Edit source ${index + 1}`}
            variant="secondary"
            disabled={action.busy}
            onPress={() => source(index)}
          />
          <Button
            title={`Remove source ${index + 1}`}
            variant="danger"
            disabled={action.busy}
            onPress={() =>
              setDraft(value => ({
                ...value,
                sources: value.sources.filter((_, i) => i !== index),
              }))
            }
          />
        </Stack>
      ))}
      <Button
        title="Add source"
        disabled={action.busy}
        onPress={() => source()}
      />
      {!draft.title.trim() ||
      !draft.category.trim() ||
      !draft.description.trim() ||
      !draft.requirements.length ? (
        <AppText variant="caption" color="secondary">
          Add a package name, category, description and at least one requirement
          to enable saving.
        </AppText>
      ) : null}
      <Button
        title="Save catalogue package"
        disabled={
          action.busy ||
          !draft.title.trim() ||
          !draft.category.trim() ||
          !draft.description.trim() ||
          !draft.requirements.length
        }
        onPress={() => {
          void action.run(async () => {
            if (
              !draft.title.trim() ||
              !draft.category.trim() ||
              !draft.description.trim() ||
              !draft.requirements.length
            )
              throw new Error(
                'Add a name, category, description and at least one requirement.',
              );
            if (existing)
              await mobileApi.adminPackages.update(existing.slug, draft);
            else await mobileApi.adminPackages.create(draft);
            onSaved();
            onClose();
          }, '');
        }}
      />
      <Button
        title="Discard changes"
        variant="ghost"
        disabled={action.busy}
        onPress={() =>
          confirmAction(
            'Discard package changes?',
            onClose,
            'Your unsaved changes will be discarded.',
          )
        }
      />
      {action.message ? (
        <AppText color="danger">{action.message}</AppText>
      ) : null}
      <ActiveForm form={form} onClose={() => setForm(null)} />
    </DetailSheet>
  );
}
