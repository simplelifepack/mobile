import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import { LoadingState } from '../../components/feedback/LoadingState';
import { usePendingFiles } from '../shared/usePendingFiles';
import { documentsApi } from '../../api/documents.api';
import type {
  AnalyzeDocumentResponse,
  DocumentRecord,
} from '../../api/web.types';
import { pickDocuments, pickGallery } from '../../native/documentFiles';
import { DetailSheet } from '../shared/DetailSheet';
import { ActiveForm } from '../shared/RecordForm';
import { AppText, Button, Stack, useAction } from '../shared/FeatureUI';

/** The saved document survives a failed consumer action, so Retry never uploads it twice. */
export function UploadDocumentSheet({
  onClose,
  onSaved,
  category,
  documentType,
  initialFiles,
}: {
  onClose: () => void;
  onSaved: (document: DocumentRecord) => Promise<unknown>;
  category?: string;
  documentType?: string;
  initialFiles?: import('../../native/documentFiles').PickedDocument[];
}) {
  const started = React.useRef(false);
  const [analysis, setAnalysis] = React.useState<AnalyzeDocumentResponse>();
  const [reviewing, setReviewing] = React.useState(false);
  const analyzedWithAI = Boolean(
    analysis &&
    !analysis.warnings.some(warning => warning.code.startsWith('AI_')) &&
    analysis.document.documentType.toLowerCase() !== 'unknown',
  );
  const saved = React.useRef<DocumentRecord | undefined>(undefined);
  const action = useAction();
  const pending = usePendingFiles();
  const choose = async (source: 'files' | 'gallery' | 'camera' = 'files') => {
    const files =
      source === 'camera'
        ? await captureDocuments()
        : source === 'gallery'
          ? await pickGallery()
          : await pickDocuments();
    if (!files.length) return;
    await pending.run(files, async items => {
      setAnalysis(await documentsApi.analyze(items));
      setReviewing(true);
    });
  };
  React.useEffect(() => {
    if (!initialFiles?.length || started.current) return;
    started.current = true;
    void action.run(
      () =>
        pending.run(initialFiles, async items => {
          setAnalysis(await documentsApi.analyze(items));
          setReviewing(true);
        }),
      '',
    );
    // A selection is consumed once per upload flow, independently of native modal events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);
  const finish = async (document: DocumentRecord) => {
    await onSaved(document);
    onClose();
  };
  return (
    <DetailSheet
      title={initialFiles?.length ? 'Review document' : 'Upload document'}
      onClose={onClose}
      busy={action.busy}
    >
      <Stack>
        {pending.files.length && !action.busy ? (
          <Button
            title="Retry selected files"
            disabled={action.busy}
            onPress={() => {
              void action.run(
                () =>
                  pending.run(pending.files, async items => {
                    setAnalysis(await documentsApi.analyze(items));
                    setReviewing(true);
                  }),
                '',
              );
            }}
          />
        ) : null}
        <AppText>
          Files are encrypted before upload. Review the details before saving.
        </AppText>
        {action.busy ? (
          <LoadingState
            compact
            skeleton={false}
            label={
              pending.files.length
                ? 'Uploading and analysing your document…'
                : 'Opening document source…'
            }
          />
        ) : null}
        {!saved.current && !initialFiles?.length ? (
          <>
            <Button
              title="Capture document"
              disabled={action.busy}
              onPress={() => {
                void action.run(() => choose('camera'), '');
              }}
            />
            <Button
              title="Choose files"
              disabled={action.busy}
              onPress={() => {
                void action.run(() => choose(), '');
              }}
            />
            <Button
              title="From gallery"
              variant="secondary"
              disabled={action.busy}
              onPress={() => {
                void action.run(() => choose('gallery'), '');
              }}
            />
          </>
        ) : saved.current ? (
          <Button
            title="Retry next step with saved document"
            disabled={action.busy}
            onPress={() => {
              void action.run(() => finish(saved.current!), '');
            }}
          />
        ) : null}
        {analysis?.warnings.map((warning, index) => (
          <AppText key={index}>{warning.message}</AppText>
        ))}
        {analysis && !reviewing && !saved.current ? (
          <Button title="Review document" onPress={() => setReviewing(true)} />
        ) : null}
        {action.message ? (
          <AppText color="danger">{action.message}</AppText>
        ) : null}
        <ActiveForm
          onClose={() => setReviewing(false)}
          form={
            analysis && reviewing
              ? {
                  title: 'Review document',
                  fields: [
                    {
                      key: 'title',
                      label: 'Title',
                      required: true,
                      initial: analysis.document.title,
                    },
                    {
                      key: 'category',
                      label: 'Category',
                      required: true,
                      initial: category ?? analysis.document.category,
                    },
                    {
                      key: 'documentType',
                      label: 'Document type',
                      required: true,
                      initial: documentType ?? analysis.document.documentType,
                    },
                    {
                      key: 'expiry',
                      label: 'Expiry',
                      type: 'date',
                      initial: analysis.document.expiryDate ?? '',
                    },
                    ...Object.entries(analysis.document.fields ?? {}).map(
                      ([key, value]) => ({
                        key: `field:${key}`,
                        label: key,
                        initial: String(value ?? ''),
                      }),
                    ),
                  ],
                  submit: async values => {
                    const first = analysis.files[0];
                    if (!first)
                      throw new Error(
                        'No uploaded files. Choose your document again.',
                      );
                    if (!saved.current) {
                      const result = await documentsApi.save({
                        tempFileIds: analysis.files.map(
                          file => file.tempFileId,
                        ),
                        originalName: first.originalName,
                        mimeType: first.mimeType,
                        size: analysis.files.reduce(
                          (sum, file) => sum + file.size,
                          0,
                        ),
                        title: values.title,
                        category: values.category,
                        documentType: values.documentType,
                        confidence: analyzedWithAI ? 90 : 0,
                        fields: Object.fromEntries(
                          Object.entries(values)
                            .filter(([key]) => key.startsWith('field:'))
                            .map(([key, value]) => [key.slice(6), value]),
                        ),
                        reviewFields: [],
                        evidence: [],
                        warnings: analysis.warnings,
                        rawExtractedText: analysis.document.extractedText ?? '',
                        analysisSource: analyzedWithAI ? 'ai' : 'manual',
                        expiry: values.expiry || null,
                        userConfirmedUnknown: true,
                        duplicateAction: 'keep_both',
                      });
                      saved.current = result.document;
                    }
                    await finish(saved.current);
                  },
                }
              : null
          }
        />
      </Stack>
    </DetailSheet>
  );
}
