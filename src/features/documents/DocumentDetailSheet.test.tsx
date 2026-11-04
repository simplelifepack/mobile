import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  DocumentDetailSheet,
  documentDetailFacts,
} from './DocumentDetailSheet';
import type { DocumentRecord } from '../../api/web.types';
jest.mock('../../components/primitives/AppModal', () => ({
  AppModal: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
const document: DocumentRecord = {
  id: 'identity',
  displayName: 'Aadhaar',
  originalName: 'identity.jpeg',
  documentType: 'aadhaar',
  category: 'identity',
  source: 'MANUAL_UPLOAD',
  mimeType: 'image/jpeg',
  size: 37888,
  analysisSource: 'manual',
  confidence: 1,
  classificationConfidence: 1,
  classificationStatus: 'verified',
  ownershipStatus: 'verified',
  readinessEligible: true,
  fields: { uniqueIdentifier: 'private-id' },
  createdAt: '2026-09-28T00:00:00Z',
  updatedAt: '2026-09-28T00:00:00Z',
};
it('formats the same document facts as the web drawer', () => {
  expect(documentDetailFacts(document)).toEqual([
    ['Category', 'Identity'],
    ['Source', 'Manual Upload'],
    ['Added', '28 Sept 2026'],
    ['Size', '37 KB'],
  ]);
  expect(documentDetailFacts({ ...document, sourceProvider: 'DIGILOCKER' })[1][1]).toBe('DigiLocker');
  expect(
    documentDetailFacts({
      ...document,
      source: 'GOOGLE_DRIVE',
      size: 0,
      createdAt: 'invalid',
    })[1][1],
  ).toBe('Google Drive');
  expect(documentDetailFacts({ ...document, createdAt: 'invalid' })[2][1]).toBe(
    'Unknown',
  );
});
it('keeps preview and delete actions accessible without dumping private extracted fields', async () => {
  const preview = jest.fn(),
    remove = jest.fn(),
    close = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <DocumentDetailSheet
          document={document}
          busy={false}
          onClose={close}
          onPreview={preview}
          onDelete={remove}
        />
      </AppThemeProvider>,
    );
  });
  expect(JSON.stringify(tree.toJSON())).not.toContain('private-id');
  const press = async (label: string) => {
    const node = tree.root.findAll(
      n =>
        n.props.accessibilityLabel === label &&
        typeof n.props.onPress === 'function',
    )[0];
    await act(async () => node.props.onPress());
  };
  await press('Preview document');
  expect(preview).toHaveBeenCalledTimes(1);
  await press('Delete document');
  expect(remove).toHaveBeenCalledTimes(1);
  await press('Close document details');
  expect(close).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
