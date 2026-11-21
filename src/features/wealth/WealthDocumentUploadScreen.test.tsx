import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { WealthDocumentUploadScreen } from './WealthDocumentUploadScreen';
import type { SelectedDocument } from '../documents/documentImport';

let mockOnStart: (file: SelectedDocument, cancel: () => void) => void;
let mockOnStage: (stage: 'extracting') => void;
let mockOnPersisting: () => void;

jest.mock('react-native-file-access', () => ({
  FileSystem: {
    stat: jest.fn().mockResolvedValue({ size: 320 * 1024 }),
  },
}));

jest.mock('./wealthDocumentImport', () => ({
  pickAndSaveDocument: jest.fn(
    (_onSaved, onStart, _onEnd, _onError, onStage, onPersisting) => {
      mockOnStart = onStart;
      mockOnStage = onStage;
      mockOnPersisting = onPersisting;
      return [
        { label: 'Choose file', onPress: jest.fn() },
        { label: 'Photo library', onPress: jest.fn() },
        { label: 'Camera', onPress: jest.fn() },
      ];
    },
  ),
}));

it('explains supported files, review-before-save and offers document sources', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthDocumentUploadScreen
          visible
          userName="Divya"
          onClose={jest.fn()}
          onUploaded={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });

  const text = renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(text).toContain('Upload document');
  expect(text).toContain('PDF, JPG or PNG · Up to 10 MB');
  expect(text).toContain(
    'Your Wealth entry will not be saved until you review and confirm the extracted details.',
  );

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Choose a document')!
      .props.onPress();
  });

  const sourceLabels = renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat();
  expect(sourceLabels).toContain('Choose file');
  expect(sourceLabels).toContain('Photo library');
  expect(sourceLabels).toContain('Camera');
});

it('shows real extraction and completed-analysis stages while saving the original', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthDocumentUploadScreen
          visible
          onClose={jest.fn()}
          onUploaded={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  const selected: SelectedDocument = {
    path: '/cache/statement.pdf',
    fileName: 'HDFC_statement_Nov.pdf',
    mimeType: 'application/pdf',
  };

  await act(async () => {
    mockOnStart(selected, jest.fn());
    mockOnStage('extracting');
    await Promise.resolve();
  });

  const extractionText = renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(extractionText).toContain('Reading document');
  expect(extractionText).toContain('Extracting account details…');
  expect(extractionText).toContain('Uploading and analyzing…');

  await act(async () => {
    mockOnPersisting();
  });

  const savingText = renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');
  expect(savingText).toContain('Uploaded · 320 KB');
  expect(savingText).toContain('Upload complete');
  expect(savingText).toContain('Finding relevant details');
  expect(savingText).toContain('Adding original to your vault');
});
