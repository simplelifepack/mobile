import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { documentsApi } from '../../api/documents.api';
import { wealthApi } from '../../api/wealth.api';
import type { DocumentAnalysisResponse, DocumentRecord } from '../../api/types';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { DocumentImportProgress } from './DocumentImportProgress';
import { DocumentsScreen } from './DocumentsScreen';
import {
  analyzeSelectedDocument,
  discardSelectedDocument,
  selectDocumentFiles,
} from './documentImport';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), setParams: jest.fn() }),
  useRoute: () => ({ params: {} }),
  useIsFocused: () => true,
  useFocusEffect: jest.fn(),
}));
jest.mock('../../services/api', () => ({
  useDocumentsQuery: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn().mockResolvedValue({}),
  }),
}));
jest.mock('../../components/navigation/ProfileAvatarButton', () => ({
  ProfileAvatarButton: () => null,
}));
jest.mock('./documentImport/combinePrompt', () => ({
  askToCombine: jest.fn().mockResolvedValue('separate'),
}));
jest.mock('./documentImport', () => ({
  analyzeSelectedDocument: jest.fn(),
  discardSelectedDocument: jest.fn().mockResolvedValue(undefined),
  selectDocumentFiles: jest.fn(),
  selectImagesFromGallery: jest.fn(),
  captureDocumentPhoto: jest.fn(),
  startConsentedImport: async ({
    select,
    onConsent,
  }: {
    select: () => Promise<unknown>;
    onConsent: (selected: unknown, consent: boolean) => void;
  }) => {
    const files = await select();
    if (files) onConsent(files, true);
  },
}));

const files = [
  {
    path: '/first.pdf',
    fileName: 'first.pdf',
    mimeType: 'application/pdf' as const,
  },
  {
    path: '/second.pdf',
    fileName: 'second.pdf',
    mimeType: 'application/pdf' as const,
  },
];
const analysis: DocumentAnalysisResponse = {
  success: true,
  document: {
    title: 'First',
    category: 'Other',
    documentType: 'Other',
    confidence: 90,
  },
  files: [
    {
      tempFileId: 'temp',
      originalName: 'first.pdf',
      mimeType: 'application/pdf',
      size: 10,
    },
  ],
  warnings: [],
};
const document: DocumentRecord = {
  id: 'doc',
  originalName: 'first.pdf',
  documentType: 'Other',
  category: 'Other',
  classificationStatus: 'detected',
  ownershipStatus: 'unknown',
  confidence: 90,
  createdAt: '',
};

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.useRealTimers();
});

it('finishes the active upload and discards queued files on cancellation', async () => {
  jest.useFakeTimers();
  jest.mocked(selectDocumentFiles).mockResolvedValue(files);
  let finish!: (value: DocumentAnalysisResponse) => void;
  jest.mocked(analyzeSelectedDocument).mockReturnValue(
    new Promise(resolve => {
      finish = resolve;
    }),
  );
  const save = jest
    .spyOn(documentsApi, 'save')
    .mockResolvedValue({ document, healthRecord: null });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <DocumentsScreen />
      </AppThemeProvider>,
    );
  });
  const sheet = renderer.root
    .findAllByType(ActionSheet)
    .find(item => item.props.title === 'Add documents')!;
  await act(async () => {
    await sheet.props.options[0].onPress();
  });
  await act(async () => {
    jest.advanceTimersByTime(450);
  });
  expect(analyzeSelectedDocument).toHaveBeenCalledTimes(1);
  expect(renderer.root.findByType(DocumentImportProgress).props).toEqual(
    expect.objectContaining({
      total: 2,
      completed: 0,
      saved: 0,
      currentName: 'first.pdf',
    }),
  );
  await act(async () => {
    renderer.root.findByType(DocumentImportProgress).props.onCancel();
  });
  expect(discardSelectedDocument).toHaveBeenCalledWith(files[1]);
  expect(discardSelectedDocument).not.toHaveBeenCalledWith(files[0]);
  expect(renderer.root.findByType(DocumentImportProgress).props.cancelled).toBe(
    true,
  );
  await act(async () => {
    finish(analysis);
  });
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => {
    jest.advanceTimersByTime(450);
  });
  expect(analyzeSelectedDocument).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByType(DocumentImportProgress)).toHaveLength(0);
  await act(async () => {
    renderer.unmount();
  });
});

it('advances to the next file and reports the number saved', async () => {
  jest.useFakeTimers();
  jest.mocked(selectDocumentFiles).mockResolvedValue(files);
  let finishSecond!: (value: DocumentAnalysisResponse) => void;
  jest
    .mocked(analyzeSelectedDocument)
    .mockResolvedValueOnce(analysis)
    .mockReturnValueOnce(
      new Promise(resolve => {
        finishSecond = resolve;
      }),
    );
  const save = jest
    .spyOn(documentsApi, 'save')
    .mockResolvedValue({ document, healthRecord: null });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <DocumentsScreen />
      </AppThemeProvider>,
    );
  });
  const sheet = renderer.root
    .findAllByType(ActionSheet)
    .find(item => item.props.title === 'Add documents')!;
  await act(async () => {
    await sheet.props.options[0].onPress();
  });
  await act(async () => {
    jest.advanceTimersByTime(450);
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(renderer.root.findByType(DocumentImportProgress).props).toEqual(
    expect.objectContaining({ total: 2, completed: 1, saved: 1 }),
  );
  await act(async () => {
    jest.advanceTimersByTime(450);
  });
  expect(renderer.root.findByType(DocumentImportProgress).props).toEqual(
    expect.objectContaining({
      total: 2,
      completed: 1,
      saved: 1,
      currentName: 'second.pdf',
    }),
  );
  await act(async () => {
    finishSecond(analysis);
  });
  await act(async () => {
    jest.advanceTimersByTime(450);
  });
  expect(save).toHaveBeenCalledTimes(2);
  expect(renderer.root.findAllByType(DocumentImportProgress)).toHaveLength(0);
  await act(async () => {
    renderer.unmount();
  });
});

it('adds saved wealth-related documents to Wealth with the document attached', async () => {
  jest.useFakeTimers();
  jest.mocked(selectDocumentFiles).mockResolvedValue([files[0]]);
  jest.mocked(analyzeSelectedDocument).mockResolvedValue({
    ...analysis,
    document: {
      ...analysis.document,
      title: 'HDFC savings statement',
      category: 'Finance',
      documentType: 'Bank Statement',
      fields: {
        bankName: 'HDFC',
        accountNumber: '123456789012',
        currentBalance: '480000',
      },
    },
  });
  jest
    .spyOn(documentsApi, 'save')
    .mockResolvedValue({ document, healthRecord: null });
  const createWealthRecord = jest
    .spyOn(wealthApi, 'createRecord')
    .mockResolvedValue({
      id: 'wealth-record',
      type: 'ASSET',
      title: 'HDFC savings statement',
      details: {},
      attachmentDocumentIds: ['doc'],
      attachments: [],
      createdAt: '',
      updatedAt: '',
    });

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <DocumentsScreen />
      </AppThemeProvider>,
    );
  });
  const sheet = renderer.root
    .findAllByType(ActionSheet)
    .find(item => item.props.title === 'Add documents')!;
  await act(async () => {
    await sheet.props.options[0].onPress();
  });
  await act(async () => {
    jest.advanceTimersByTime(450);
  });

  expect(createWealthRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'ASSET',
      attachmentDocumentIds: ['doc'],
      details: expect.objectContaining({
        sourceDocumentId: 'doc',
        institution: 'HDFC',
        accountRef: '123456789012',
        amount: '480000',
      }),
    }),
  );
  await act(async () => {
    renderer.unmount();
  });
});
