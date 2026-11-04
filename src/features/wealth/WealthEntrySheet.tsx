import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import {
  pickDocuments,
  pickGallery,
  type PickedDocument,
} from '../../native/documentFiles';
import { documentDefaults, entryPayload } from './wealthEntryModel';
import { mobileApi } from '../../api/mobile.api';
import type { DocumentRecord } from '../../api/web.types';
import { UploadDocumentSheet } from '../documents/UploadDocumentSheet';
import { DetailSheet } from '../shared/DetailSheet';
import { ActiveForm, type FormField } from '../shared/RecordForm';
import {
  AppText,
  Button,
  Choice,
  ResourceStatus,
  useResource,
  useAction,
} from '../shared/FeatureUI';

export function WealthEntrySheet({
  mode,
  initialFiles,
  onClose,
  onSaved,
  onVaultChanged,
}: {
  mode: 'holding' | 'money';
  initialFiles?: PickedDocument[];
  onClose: () => void;
  onSaved: () => void;
  onVaultChanged: () => void;
}) {
  const documents = useResource(mobileApi.documents.list);
  const family = useResource(mobileApi.trust.get);
  const [selected, setSelected] = React.useState<DocumentRecord>();
  const [pendingFiles, setPendingFiles] = React.useState(initialFiles);
  const [uploading, setUploading] = React.useState(
    Boolean(initialFiles?.length),
  );
  const [editing, setEditing] = React.useState(false);
  const sourceAction = useAction();
  const chooseSource = (source: 'camera' | 'files' | 'gallery') => {
    void sourceAction.run(async () => {
      const files =
        source === 'camera'
          ? await captureDocuments()
          : source === 'gallery'
            ? await pickGallery()
            : await pickDocuments();
      if (!files.length) return;
      setPendingFiles(files);
      setUploading(true);
    }, '');
  };
  const defaults = documentDefaults(selected);
  const fields: FormField[] = [
    {
      key: 'title',
      label: mode === 'money' ? 'What for' : 'Holding name',
      required: true,
      initial: defaults.title,
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'number',
      required: mode === 'money',
      initial: defaults.amount,
    },
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      initial: defaults.currency,
    },
    ...(mode === 'money'
      ? [
          {
            key: 'direction',
            label: 'Which way',
            options: ['LENT', 'BORROWED'],
            initial: 'LENT',
          },
          {
            key: 'date',
            label: 'Transaction date',
            required: true,
            type: 'date' as const,
            initial: new Date().toISOString().slice(0, 10),
          },
          { key: 'who', label: 'Who' },
          { key: 'followUpDate', label: 'Follow up on', type: 'date' as const },
          { key: 'followUpNote', label: 'Follow-up note' },
        ]
      : [
          {
            key: 'kind',
            label: 'Kind',
            options: ['asset', 'liability', 'cover'],
            initial: defaults.kind,
          },
          {
            key: 'type',
            label: 'Holding type',
            required: true,
            initial: defaults.type,
          },
          {
            key: 'institution',
            label: 'Institution',
            initial: defaults.institution,
          },
          {
            key: 'accountRef',
            label: 'Account / policy reference',
            initial: defaults.accountRef,
          },
          {
            key: 'memberId',
            label: 'Belongs to',
            options: [
              { label: 'You', value: 'you' },
              ...(family.data?.members ?? []).map(member => ({
                label: member.name,
                value: member.id,
              })),
            ],
            initial: 'you',
          },
          {
            key: 'renewalDate',
            label: 'Renewal date',
            type: 'date' as const,
            initial: defaults.renewalDate,
          },
          {
            key: 'maturityDate',
            label: 'Maturity date',
            type: 'date' as const,
            initial: defaults.maturityDate,
          },
          {
            key: 'accessInstruction',
            label: 'Family access instructions',
            type: 'multiline' as const,
          },
          { key: 'nomineeName', label: 'Nominee name (if named)' },
        ]),
  ];
  if (uploading)
    return (
      <UploadDocumentSheet
        initialFiles={pendingFiles}
        onClose={() => {
          setUploading(false);
          setPendingFiles(undefined);
        }}
        onSaved={async document => {
          setSelected(document);
          documents.refresh();
          onVaultChanged();
          setUploading(false);
        }}
      />
    );
  return (
    <DetailSheet
      title={mode === 'money' ? 'Money lent or borrowed' : 'From a document'}
      onClose={onClose}
    >
      <ResourceStatus resource={documents} />
      <Choice
        label="Document (optional)"
        value={selected?.id ?? ''}
        options={[
          { label: 'No document', value: '' },
          ...(selected &&
          !documents.data?.some(document => document.id === selected.id)
            ? [selected, ...(documents.data ?? [])]
            : (documents.data ?? [])
          ).map(document => ({
            label: document.displayName || document.originalName,
            value: document.id,
          })),
        ]}
        onChange={id =>
          setSelected(documents.data?.find(document => document.id === id))
        }
      />
      <Button
        title="Capture document"
        disabled={sourceAction.busy}
        onPress={() => chooseSource('camera')}
      />
      <Button
        title="Choose files"
        variant="secondary"
        disabled={sourceAction.busy}
        onPress={() => chooseSource('files')}
      />
      <Button
        title="From gallery"
        variant="secondary"
        disabled={sourceAction.busy}
        onPress={() => chooseSource('gallery')}
      />
      {sourceAction.message ? (
        <AppText color="danger">{sourceAction.message}</AppText>
      ) : null}
      {selected ? (
        <AppText>
          Details found in {selected.displayName || selected.originalName} will
          be filled below. Check them before saving.
        </AppText>
      ) : null}
      <Button title="Enter details" onPress={() => setEditing(true)} />
      <ActiveForm
        onClose={() => setEditing(false)}
        form={
          editing
            ? {
                title:
                  mode === 'money'
                    ? 'Lent or borrowed details'
                    : 'Holding details',
                fields,
                submit: async values => {
                  await mobileApi.wealth.createRecord(
                    entryPayload(mode, values, selected?.id),
                  );
                  onSaved();
                  onClose();
                },
              }
            : null
        }
      />
    </DetailSheet>
  );
}
