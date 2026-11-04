import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { ProofCaptureDialog } from './ProofCaptureDialog';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Button } from '../../components/primitives/Button';
import { TextInput } from '../../components/primitives/TextInput';
import { cleanupPickedDocuments } from '../../native/documentFiles';
jest.mock('../../native/documentFiles', () => ({
  cleanupPickedDocuments: jest.fn().mockResolvedValue(undefined),
  pickDocuments: jest.fn(),
  pickGallery: jest.fn(),
}));
jest.mock('../shared/DetailSheet', () => ({
  DetailSheet: ({ children }: React.PropsWithChildren) => children,
}));
it('reviews an already captured proof without asking for its source again and cleans up on exit', async () => {
  const files = [
    {
      uri: 'file:///tmp/proof.jpg',
      name: 'proof.jpg',
      type: 'image/jpeg',
      size: 100,
    },
  ];
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <ProofCaptureDialog
          initialFiles={files}
          onSaved={jest.fn()}
          onVaultChanged={jest.fn()}
          onClose={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  const sources = [
    'Choose proof files',
    'Change proof files',
    'Capture proof with camera',
    'From gallery',
  ];
  expect(
    tree.root
      .findAllByType(Button)
      .filter(node => sources.includes(node.props.title)),
  ).toHaveLength(0);
  expect(
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label === 'What for')!.props.value,
  ).toBe('proof');
  expect(JSON.stringify(tree.toJSON())).toContain('proof.jpg');
  await act(async () => tree.unmount());
  expect(cleanupPickedDocuments).toHaveBeenCalledWith(files);
});
