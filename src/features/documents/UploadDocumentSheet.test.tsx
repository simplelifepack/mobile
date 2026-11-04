import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { UploadDocumentSheet } from './UploadDocumentSheet';
import { documentsApi } from '../../api/documents.api';
import { captureDocuments } from '../../native/captureDocuments';
import { ActiveForm } from '../shared/RecordForm';
import { Button } from '../../components/primitives/Button';
jest.mock('../../native/captureDocuments', () => ({
  captureDocuments: jest.fn(),
}));
jest.mock('../../native/documentFiles', () => ({
  pickDocuments: jest.fn(),
  pickGallery: jest.fn(),
  cleanupPickedDocuments: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../api/documents.api', () => ({
  documentsApi: { analyze: jest.fn(), save: jest.fn() },
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../shared/RecordForm', () => ({ ActiveForm: () => null }));
const files = [
  {
    uri: 'file:///tmp/captured.jpg',
    name: 'captured.jpg',
    type: 'image/jpeg',
    size: 100,
  },
];
const analysis = {
  document: {
    title: 'Test report',
    category: 'Medical',
    documentType: 'Lab report',
    fields: {},
  },
  files: [
    {
      tempFileId: 'temp',
      originalName: 'captured.jpg',
      mimeType: 'image/jpeg',
      size: 100,
    },
  ],
  warnings: [],
};
it('analyses captured files once without another source chooser or a native modal callback', async () => {
  let complete!: (value: never) => void;
  jest.mocked(documentsApi.analyze).mockReturnValue(
    new Promise(resolve => {
      complete = resolve;
    }),
  );
  let tree!: Renderer.ReactTestRenderer;
  const render = () => (
    <AppThemeProvider>
      <UploadDocumentSheet
        initialFiles={files}
        onSaved={jest.fn()}
        onClose={jest.fn()}
      />
    </AppThemeProvider>
  );
  await act(async () => {
    tree = Renderer.create(render());
  });
  expect(documentsApi.analyze).toHaveBeenCalledWith(files);
  expect(captureDocuments).not.toHaveBeenCalled();
  const sourceTitles = ['Capture document', 'Choose files', 'From gallery'];
  expect(
    tree.root
      .findAllByType(Button)
      .filter(node => sourceTitles.includes(node.props.title)),
  ).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Uploading and analysing your document…',
  );
  await act(async () => complete(analysis as never));
  expect(tree.root.findByType(ActiveForm).props.form.title).toBe(
    'Review document',
  );
  await act(async () => tree.update(render()));
  expect(documentsApi.analyze).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
