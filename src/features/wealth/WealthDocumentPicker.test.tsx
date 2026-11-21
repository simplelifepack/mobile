import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { documentsApi } from '../../api/documents.api';
import type { DocumentRecord } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  analysisFromVaultDocument,
  WealthDocumentPicker,
} from './WealthDocumentPicker';
import { draftFromDocument } from './WealthHoldingForm';

jest.mock('../../api/documents.api', () => ({
  documentsApi: { list: jest.fn() },
}));

const documents: DocumentRecord[] = [
  {
    id: 'statement',
    title: 'HDFC statement',
    displayName: 'HDFC_statement_Nov.pdf',
    originalName: 'statement.pdf',
    documentType: 'Savings',
    category: 'Banking',
    classificationStatus: 'verified',
    ownershipStatus: 'verified',
    confidence: 0.96,
    createdAt: '2026-11-10T10:00:00.000Z',
    size: 320 * 1024,
    fields: {
      institution: 'HDFC Bank',
      accountNumberMasked: '••••4821',
      balance: 24000,
    },
  },
  {
    id: 'policy',
    title: 'LIC policy',
    originalName: 'policy.pdf',
    documentType: 'Life insurance',
    category: 'Insurance',
    classificationStatus: 'verified',
    ownershipStatus: 'verified',
    confidence: 0.9,
    createdAt: '2026-11-02T10:00:00.000Z',
    size: 1200 * 1024,
  },
];

async function renderPicker(
  onExtract = jest.fn(),
  onClose = jest.fn(),
  onUploadAnother = jest.fn(),
) {
  jest.mocked(documentsApi.list).mockResolvedValue(documents);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthDocumentPicker
          visible
          onClose={onClose}
          onExtract={onExtract}
          onUploadAnother={onUploadAnother}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onExtract, onClose, onUploadAnother };
}

it('lists vault documents, supports search and extracts the selected document', async () => {
  const ui = await renderPicker();
  const search = ui.renderer.root.findByProps({
    accessibilityLabel: 'Search documents',
  });

  expect(
    ui.renderer.root.findAllByType(AppText).map(item => item.props.children),
  ).toContain('Choose from your vault');
  expect(
    ui.renderer.root
      .findAllByType(AppText)
      .some(item => JSON.stringify(item.props.children).includes('LIC policy')),
  ).toBe(true);

  await act(async () => {
    search.props.onChangeText('HDFC');
  });
  expect(
    ui.renderer.root
      .findAllByType(AppText)
      .some(item => JSON.stringify(item.props.children).includes('LIC policy')),
  ).toBe(false);

  await act(async () => {
    ui.renderer.root
      .findAll(node => node.props.accessibilityRole === 'radio')[0]
      .props.onPress();
  });
  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(item => item.props.title === 'Extract details')!
      .props.onPress();
  });

  expect(ui.onExtract).toHaveBeenCalledWith(documents[0]);
});

it('returns to upload another document without extracting', async () => {
  const ui = await renderPicker();

  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(item => item.props.title === 'Upload another document')!
      .props.onPress();
  });

  expect(ui.onUploadAnother).toHaveBeenCalledTimes(1);
  expect(ui.onExtract).not.toHaveBeenCalled();
});

it('uses only saved vault metadata when preparing the document draft', () => {
  expect(analysisFromVaultDocument(documents[0])).toEqual({
    title: 'HDFC_statement_Nov.pdf',
    category: 'Banking',
    documentType: 'Savings',
    confidence: 0.96,
    fields: documents[0].fields,
    reviewFields: [],
  });
});

it('maps saved extraction values into reviewable Wealth form fields', () => {
  expect(draftFromDocument(analysisFromVaultDocument(documents[0]))).toEqual(
    expect.objectContaining({
      name: 'HDFC_statement_Nov.pdf',
      kind: 'asset',
      type: 'Other',
      otherType: 'Savings',
      institution: 'HDFC Bank',
      accountRef: '••••4821',
      value: '24000',
    }),
  );
});

it('maps bank statement fields into the extracted-details review', () => {
  expect(
    draftFromDocument({
      title: 'HDFC_statement_Nov.pdf',
      category: 'Banking',
      documentType: 'Bank account',
      fields: {
        accountName: 'HDFC Savings',
        accountHolder: 'Divya Rao',
        bankName: 'HDFC Bank',
        accountNumberMasked: '•••• 4821',
        balance: 480000,
        balanceAsOf: '2026-11-10',
        branchName: 'Indiranagar',
      },
    }),
  ).toEqual(
    expect.objectContaining({
      name: 'HDFC Savings',
      otherType: 'Bank account',
      ownerName: 'Divya Rao',
      institution: 'HDFC Bank',
      accountRef: '•••• 4821',
      value: '480000',
      balanceAsOf: '2026-11-10',
      bankBranch: 'Indiranagar',
    }),
  );
});
