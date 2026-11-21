import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import type { DocumentAnalysisResponse } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  WealthExtractedDetailsReview,
  type ExtractedReviewValues,
} from './WealthExtractedDetailsReview';

const analysis: DocumentAnalysisResponse['document'] = {
  title: 'HDFC statement',
  category: 'Banking',
  documentType: 'Bank account',
  confidence: 0.96,
  fields: {
    accountName: 'HDFC Savings',
    accountNumberMasked: '•••• 4821',
    balance: 480000,
    balanceAsOf: '2026-11-10',
    bankName: 'HDFC Bank',
  },
};

const values: ExtractedReviewValues = {
  entryType: 'Bank account',
  accountName: 'HDFC Savings',
  owner: 'Divya Rao',
  accountRef: '•••• 4821',
  balance: '480000',
  balanceAsOf: '2026-11-10',
  institution: 'HDFC Bank',
  bankBranch: '',
};

it('shows editable extracted fields, their source and review actions', async () => {
  const onChange = jest.fn();
  const onContinue = jest.fn();
  const onEnterManually = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthExtractedDetailsReview
          visible
          document={{
            id: 'statement-id',
            title: 'HDFC_statement_Nov.pdf',
            analysis,
          }}
          values={values}
          owners={[
            { id: 'self', name: 'Divya Rao' },
            { id: 'spouse', name: 'Venkat Rao' },
          ]}
          selectedOwnerId="self"
          userName="Divya Rao"
          onChange={onChange}
          onOwnerChange={jest.fn()}
          onClose={jest.fn()}
          onContinue={onContinue}
          onEnterManually={onEnterManually}
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
  expect(text).toContain('Step 2 of 3 · Check extracted information');
  expect(text).toContain('Please check every field');
  expect(text).toContain('Found in document');
  expect(text).toContain('Not found · Check or enter manually');

  await act(async () => {
    renderer.root
      .findByProps({ accessibilityLabel: 'Balance' })
      .props.onChangeText('500000');
  });
  expect(onChange).toHaveBeenCalledWith('balance', '500000');

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Continue to confirmation')!
      .props.onPress();
  });
  expect(onContinue).toHaveBeenCalledTimes(1);

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Enter details manually')!
      .props.onPress();
  });
  expect(onEnterManually).toHaveBeenCalledTimes(1);
});
