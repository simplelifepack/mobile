import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import { pickGallery } from '../../native/documentFiles';
import type { WealthRecord } from '../../api/web.types';
import { mobileApi } from '../../api/mobile.api';
import { documentsApi } from '../../api/documents.api';
import {
  cleanupPickedDocuments,
  pickDocuments,
  type PickedDocument,
} from '../../native/documentFiles';
import { DetailSheet } from '../shared/DetailSheet';
import {
  AppText,
  Button,
  TextInput,
  Choice,
  Stack,
  isDate,
} from '../shared/FeatureUI';
import { saveProofCapture, type ProofDraft } from './proofCapture';
const proofApi = {
  analyze: documentsApi.analyze,
  saveDocument: documentsApi.save,
  listRecords: mobileApi.wealth.records,
  getRecord: mobileApi.wealth.record,
  createRecord: mobileApi.wealth.createRecord,
  updateRecord: mobileApi.wealth.updateRecord,
};
export function ProofCaptureDialog({
  record,
  initialFiles,
  onClose,
  onSaved,
  onVaultChanged,
}: {
  record?: WealthRecord;
  initialFiles?: PickedDocument[];
  onClose: () => void;
  onSaved: () => void;
  onVaultChanged: () => void;
}) {
  const draft = React.useRef<ProofDraft>({
    captureId: `proof-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    recordId: record?.id,
  });
  const [files, setFiles] = React.useState<PickedDocument[]>(
    initialFiles ?? [],
  );
  const ownedFiles = React.useRef<PickedDocument[]>(initialFiles ?? []);
  const mounted = React.useRef(true);
  const [title, setTitle] = React.useState(
    record?.title ?? initialFiles?.[0]?.name.replace(/\.[^.]+$/, '') ?? '',
  );
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState('INR');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState('');
  const [documentSaved, setDocumentSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const running = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void cleanupPickedDocuments(ownedFiles.current);
    };
  }, []);
  const choose = async (source: 'files' | 'gallery' | 'camera' = 'files') => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const picked =
        source === 'camera'
          ? await captureDocuments()
          : source === 'gallery'
            ? await pickGallery()
            : await pickDocuments();
      if (!mounted.current) {
        await cleanupPickedDocuments(picked);
        return;
      }
      if (picked.length) {
        await cleanupPickedDocuments(ownedFiles.current);
        ownedFiles.current = picked;
        setFiles(picked);
        if (!title.trim()) setTitle(picked[0].name.replace(/\.[^.]+$/, ''));
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to choose proof.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const save = async () => {
    if (running.current) return;
    if (
      !title.trim() ||
      (!record &&
        (!isDate(date) ||
          (amount.trim() &&
            (!Number.isFinite(Number(amount)) || Number(amount) < 0))))
    ) {
      setError(
        'Enter a title, valid date, and non-negative amount when provided.',
      );
      return;
    }
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await saveProofCapture(
        proofApi,
        draft.current,
        files,
        {
          title: title.trim(),
          amount: amount.trim() ? Number(amount) : undefined,
          currency,
          transactionDate: date,
          notes,
        },
        () => {
          setDocumentSaved(true);
          onVaultChanged();
        },
      );
      onSaved();
      onClose();
    } catch (reason) {
      setError(
        `${draft.current.documentId ? 'Proof is saved in Documents. Retry to finish attaching it. ' : ''}${reason instanceof Error ? reason.message : 'Unable to save proof.'}`,
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <DetailSheet
      title={
        record
          ? 'Attach proof'
          : initialFiles?.length
            ? 'Review payment proof'
            : 'Add payment proof'
      }
      busy={busy}
      onClose={onClose}
    >
      <AppText color="muted">
        Photo, screenshot, receipt, or PDF. The proof is filed in Documents too.
        AI analysis is off for this upload.
      </AppText>
      {documentSaved ? (
        <AppText color="success">
          Proof saved in Documents. You can retry without uploading again.
        </AppText>
      ) : !initialFiles?.length ? (
        <Button
          title={files.length ? 'Change proof files' : 'Choose proof files'}
          variant="secondary"
          disabled={busy}
          onPress={() => {
            void choose();
          }}
        />
      ) : null}
      {!documentSaved && !initialFiles?.length ? (
        <>
          <Button
            title="Capture proof with camera"
            disabled={busy}
            onPress={() => {
              void choose('camera');
            }}
          />
          <Button
            title="From gallery"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              void choose('gallery');
            }}
          />
        </>
      ) : null}
      {files.length ? (
        <Stack gap="xs">
          {files.map(file => (
            <AppText key={file.uri} variant="caption" color="muted">
              {file.name}
            </AppText>
          ))}
        </Stack>
      ) : null}
      <TextInput
        label="What for"
        validate={value =>
          !value.trim() ? 'Enter what this proof is for.' : ''
        }
        value={title}
        onChangeText={setTitle}
        editable={!busy}
      />
      {!record ? (
        <>
          <TextInput
            label="Amount (optional)"
            validate={value =>
              value.trim() &&
              (!Number.isFinite(Number(value)) || Number(value) < 0)
                ? 'Enter zero or a positive number without currency symbols.'
                : ''
            }
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={!busy}
          />
          <Choice
            label="Currency"
            value={currency}
            options={['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']}
            onChange={setCurrency}
          />
          <TextInput
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            editable={!busy}
          />
          <TextInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            editable={!busy}
          />
        </>
      ) : null}
      {error ? <AppText color="danger">{error}</AppText> : null}
      <Button
        title={busy ? 'Saving…' : record ? 'Attach proof' : 'Save proof'}
        disabled={
          busy ||
          !title.trim() ||
          (!record &&
            (!isDate(date) ||
              (amount.trim() !== '' &&
                (!Number.isFinite(Number(amount)) || Number(amount) < 0)))) ||
          (!files.length && !documentSaved)
        }
        onPress={() => {
          void save();
        }}
      />
    </DetailSheet>
  );
}
