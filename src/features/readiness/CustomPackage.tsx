import { BottomSheet } from '../shared/BottomSheet';
import React from 'react';
import { mobileApi } from '../../api/mobile.api';
import { publicDocumentLabels } from '../../api/public-document-labels';
import type { CustomPackageGenerationJob } from '../../api/web.types';
import type { PackageSummary } from '../../api/types';
import { useBootstrapQuery } from '../../services/api';
import { AppText, Button, TextInput, useAction } from '../shared/FeatureUI';
import { ActiveForm, type FormConfig } from '../shared/RecordForm';
export function CustomPackage({
  onSaved,
  createRequest,
  researchRequest,
  hideTrigger = false,
}: {
  createRequest?: number;
  researchRequest?: number;
  hideTrigger?: boolean;
  onSaved: (pack: PackageSummary) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [job, setJob] = React.useState<CustomPackageGenerationJob>();
  const [form, setForm] = React.useState<FormConfig | null>(null);
  const bootstrap = useBootstrapQuery();
  const action = useAction();
  React.useEffect(() => {
    if (
      !job ||
      ['completed', 'completed_with_unverified_sources', 'failed'].includes(
        job.status,
      )
    )
      return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await mobileApi.packages.getCustomGenerationJob(job.id);
        if (active) setJob(result.job);
      } catch {
        if (active) timer = setTimeout(poll, 5000);
      }
    };
    timer = setTimeout(poll, 3000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [job]);
  const review = React.useCallback(() => {
    const draft = job?.draft;
    setForm({
      title: draft ? 'Review custom package' : 'Create custom package',
      fields: [
        {
          key: 'title',
          label: 'Title',
          required: true,
          initial: draft?.packageName ?? query,
        },
        {
          key: 'description',
          label: 'Description',
          initial: draft?.description,
        },
        {
          key: 'requirements',
          label: 'Requirements (one per line)',
          type: 'multiline',
          required: true,
          initial: draft?.requiredDocuments
            .map(item => item.title || item.name)
            .join('\n'),
        },
      ],
      submit: async values => {
        const result = await mobileApi.packages.createCustom({
          title: values.title,
          description: values.description,
          requirements: values.requirements
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean),
          ...(draft
            ? {
                source: {
                  title: draft.sourceTitle,
                  name: draft.sourceOrganization,
                  url: draft.sourceUrl,
                },
                verificationSources: draft.verificationSources,
                verificationStatus: draft.verificationStatus,
              }
            : {}),
        });
        onSaved(result.package);
        setOpen(false);
      },
    });
  }, [job, query, onSaved]);
  React.useEffect(() => {
    if (createRequest) {
      review();
    }
    // Each Home request opens the manual form once; typing must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createRequest]);
  React.useEffect(() => {
    if (researchRequest) setOpen(true);
  }, [researchRequest]);
  return (
    <>
      {!hideTrigger ? (
        <Button
          title="Create custom package"
          variant="secondary"
          onPress={() => setOpen(value => !value)}
        />
      ) : null}
      {open ? (
        <BottomSheet
          title="Create a custom pack"
          subtitle="For situations the catalog does not cover."
          busy={action.busy}
          onClose={() => setOpen(false)}
        >
          <TextInput
            label="What do you need documents for?"
            placeholder="My son’s school admission"
            multiline
            numberOfLines={2}
            value={query}
            onChangeText={setQuery}
            maxLength={160}
          />
          <Button
            title="Look it up for me"
            disabled={
              action.busy ||
              !query.trim() ||
              (job &&
                ![
                  'completed',
                  'completed_with_unverified_sources',
                  'failed',
                ].includes(job.status))
            }
            onPress={() => {
              void action.run(async () => {
                const result =
                  await mobileApi.packages.createCustomGenerationJob(
                    query.trim(),
                    publicDocumentLabels(
                      (bootstrap.data?.documents ?? []).map(
                        document =>
                          document.normalizedType ?? document.documentType,
                      ),
                    ),
                  );
                setJob(result.job);
              }, '');
            }}
          />
          <AppText align="center" color="muted" variant="caption">
            or
          </AppText>
          <Button
            title="Add the documents myself"
            variant="secondary"
            onPress={review}
          />
          {job ? (
            <>
              <AppText>{job.statusMessage || job.status}</AppText>
              {job.errorMessage ? (
                <AppText color="danger">{job.errorMessage}</AppText>
              ) : null}
              {job.disclaimer ? (
                <AppText color="secondary">{job.disclaimer}</AppText>
              ) : null}
              {job.draft ? (
                <Button title="Review researched checklist" onPress={review} />
              ) : null}
            </>
          ) : null}
          {action.message ? <AppText>{action.message}</AppText> : null}
          <ActiveForm form={form} onClose={() => setForm(null)} />
        </BottomSheet>
      ) : null}
      {!open ? <ActiveForm form={form} onClose={() => setForm(null)} /> : null}
    </>
  );
}
