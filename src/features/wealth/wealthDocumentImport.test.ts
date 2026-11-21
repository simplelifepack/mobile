import {
  analyzeSelectedDocument,
  selectDocumentFile,
  type SelectedDocument,
} from '../documents/documentImport';
import { pickAndSaveDocument } from './wealthDocumentImport';

jest.mock('../../api/documents.api', () => ({
  documentsApi: { save: jest.fn() },
}));

jest.mock('../documents/documentImport', () => ({
  analyzeSelectedDocument: jest.fn(),
  captureDocumentPhoto: jest.fn(),
  selectDocumentFile: jest.fn(),
  selectImageFromGallery: jest.fn(),
  startConsentedImport: jest.fn(async ({ select, onConsent }) => {
    const selected = await select();
    if (selected) await onConsent(selected, true);
  }),
}));

it('aborts an active analysis when the user cancels the upload', async () => {
  const selected: SelectedDocument = {
    path: '/cache/statement.pdf',
    fileName: 'statement.pdf',
    mimeType: 'application/pdf',
  };
  jest.mocked(selectDocumentFile).mockResolvedValue(selected);
  jest.mocked(analyzeSelectedDocument).mockImplementation(
    (_document, _consent, signal) =>
      new Promise((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  const onSaved = jest.fn();
  const onEnd = jest.fn();
  let cancelUpload = () => {};
  const source = pickAndSaveDocument(
    onSaved,
    (_file, cancel) => {
      cancelUpload = cancel;
    },
    onEnd,
    jest.fn(),
  )[0];

  const importing = source.onPress();
  await Promise.resolve();
  await Promise.resolve();
  expect(analyzeSelectedDocument).toHaveBeenCalledWith(
    selected,
    true,
    expect.any(AbortSignal),
    undefined,
  );

  cancelUpload();
  await importing;

  expect(onSaved).not.toHaveBeenCalled();
  expect(onEnd).toHaveBeenCalledWith(true);
});
