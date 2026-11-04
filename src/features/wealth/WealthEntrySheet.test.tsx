import React from 'react';
import { captureDocuments } from '../../native/captureDocuments';
import { Button } from '../../components/primitives/Button';
import type { PickedDocument } from '../../native/documentFiles';
jest.mock('../../native/captureDocuments', () => ({
  captureDocuments: jest.fn(),
}));
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { WealthEntrySheet } from './WealthEntrySheet';
import { UploadDocumentSheet } from '../documents/UploadDocumentSheet';
import { Choice } from '../shared/FeatureUI';
jest.mock('../../api/mobile.api', () => ({
  mobileApi: {
    documents: { list: jest.fn() },
    trust: { get: jest.fn() },
    wealth: {},
  },
}));
jest.mock('../documents/UploadDocumentSheet', () => ({
  UploadDocumentSheet: () => null,
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../shared/RecordForm', () => ({ ActiveForm: () => null }));
jest.mock('../shared/FeatureUI', () => ({
  AppText: require('react-native').Text,
  Button: require('../../components/primitives/Button').Button,
  ResourceStatus: () => null,
  Choice: () => null,
  useAction: jest.requireActual('../shared/resourceHooks').useAction,
  useResource: () => ({ data: [], loading: false, refresh: jest.fn() }),
}));
it('keeps the uploaded document selected even before a stale document list refreshes', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const changed = jest.fn();
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <WealthEntrySheet
          mode="holding"
          initialFiles={[
            {
              uri: 'file:///tmp/captured.jpg',
              name: 'captured.jpg',
              type: 'image/jpeg',
              size: 100,
            },
          ]}
          onClose={jest.fn()}
          onSaved={jest.fn()}
          onVaultChanged={changed}
        />
      </AppThemeProvider>,
    );
  });
  const upload = tree.root.findByType(UploadDocumentSheet);
  expect(upload.props.initialFiles[0].name).toBe('captured.jpg');
  const document = {
    id: 'uploaded',
    displayName: 'Policy',
    originalName: 'policy.pdf',
    documentType: 'Insurance',
    fields: {},
  };
  await act(async () => {
    await upload.props.onSaved(document);
    upload.props.onClose();
  });
  const choice = tree.root.findByType(Choice);
  expect(choice.props.value).toBe('uploaded');
  expect(choice.props.options).toContainEqual({
    label: 'Policy',
    value: 'uploaded',
  });
  expect(changed).toHaveBeenCalledTimes(1);
  let complete!: (value: PickedDocument[]) => void;
  jest.mocked(captureDocuments).mockReturnValue(
    new Promise(resolve => {
      complete = resolve;
    }),
  );
  await act(async () =>
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Capture document')!
      .props.onPress(),
  );
  expect(captureDocuments).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType(UploadDocumentSheet)).toHaveLength(0);
  const files = [
    {
      uri: 'file:///tmp/new.jpg',
      name: 'new.jpg',
      type: 'image/jpeg',
      size: 100,
    },
  ];
  await act(async () => complete(files));
  expect(tree.root.findByType(UploadDocumentSheet).props.initialFiles).toEqual(
    files,
  );
  await act(async () => tree.unmount());
});
