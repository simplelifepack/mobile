import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { WealthExtractedEntryConfirmation } from './WealthExtractedEntryConfirmation';
import type { ExtractedReviewValues } from './WealthExtractedDetailsReview';

const values: ExtractedReviewValues = {
  entryType: 'Bank account',
  accountName: 'HDFC Savings',
  owner: 'Divya Rao',
  accountRef: '•••• 4821',
  balance: '480000',
  balanceAsOf: '2026-11-10',
  institution: 'HDFC Bank',
  bankBranch: 'Indiranagar',
};

async function renderConfirmation(
  missingDetails = ['nominee', 'family access note'],
) {
  const onConfirm = jest.fn();
  const onBackToReview = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthExtractedEntryConfirmation
          visible
          documentTitle="HDFC_statement_Nov.pdf"
          values={values}
          currency="INR"
          ownerName="Divya Rao"
          userName="Divya Rao"
          missingDetails={missingDetails}
          saving={false}
          onConfirm={onConfirm}
          onBackToReview={onBackToReview}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onConfirm, onBackToReview };
}

it('summarizes the entry and gates saving on explicit review acknowledgment', async () => {
  const ui = await renderConfirmation();
  const text = ui.renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');

  expect(text).toContain('Confirm entry');
  expect(text).toContain('Step 3 of 3 · Ready to save');
  expect(text).toContain('HDFC Savings · •••• 4821');
  expect(text).toContain('Bank account · Divya Rao · ₹480000');
  expect(text).toContain('2 details still needed');
  expect(text).toContain('Attached original');

  const confirmButton = () =>
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Confirm and save')!;
  expect(confirmButton().props.disabled).toBe(true);

  await act(async () => {
    ui.renderer.root
      .findByProps({ accessibilityRole: 'checkbox' })
      .props.onPress();
  });
  expect(confirmButton().props.disabled).toBe(false);

  await act(async () => {
    confirmButton().props.onPress();
  });
  expect(ui.onConfirm).toHaveBeenCalledTimes(1);

  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Back to review')!
      .props.onPress();
  });
  expect(ui.onBackToReview).toHaveBeenCalledTimes(1);
});

it('does not show a missing-details warning when all details are present', async () => {
  const ui = await renderConfirmation([]);
  expect(
    ui.renderer.root
      .findAllByType(AppText)
      .some(item =>
        JSON.stringify(item.props.children).includes('details still needed'),
      ),
  ).toBe(false);
});

it('offers a direct path to add missing nominee information', async () => {
  const onAddNominee = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthExtractedEntryConfirmation
          visible
          documentTitle="HDFC_statement_Nov.pdf"
          values={values}
          currency="INR"
          ownerName="Divya Rao"
          missingDetails={['nominee', 'family access note']}
          saving={false}
          onConfirm={jest.fn()}
          onBackToReview={jest.fn()}
          onAddNominee={onAddNominee}
        />
      </AppThemeProvider>,
    );
  });

  await act(async () => {
    renderer.root
      .findByProps({ accessibilityLabel: 'Add nominee information' })
      .props.onPress();
  });
  expect(onAddNominee).toHaveBeenCalledTimes(1);
});
