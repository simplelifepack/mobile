import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import type { WealthRecord } from '../../api/wealth.api';
import {
  buildLoanAccessNotePayload,
  LoanAccessNoteScreen,
} from './LoanAccessNoteScreen';

const record: WealthRecord = {
  id: 'loan-1',
  type: 'LOAN_TAKEN',
  title: 'Home loan',
  details: {
    institution: 'ICICI Bank',
    loanAccountNumber: '1234567890',
    accessInstruction: 'Contact the branch.',
    accessContactName: 'Anita',
    accessContactPhone: '9876543210',
    interestRate: 8.5,
  },
  notes: 'Existing general notes',
  followUpDate: '2026-12-01',
  followUpNote: 'Review EMI',
  attachmentDocumentIds: ['document-1'],
  attachments: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-02',
};

function textContent(value: unknown): string {
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
}

async function create(
  onSave: jest.Mock,
  onClose = jest.fn(),
  initialRecord = record,
) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <LoanAccessNoteScreen
          visible
          record={initialRecord}
          userName="Divya"
          onClose={onClose}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });
  return {
    renderer,
    onClose,
    button: (title: string) =>
      renderer.root
        .findAllByType(Button)
        .find(item => item.props.title === title)!,
    input: (label: string) =>
      renderer.root.findByProps({ accessibilityLabel: label }),
    text: () =>
      renderer.root
        .findAllByType(AppText)
        .map(item => textContent(item.props.children))
        .join(' '),
  };
}

it('saves trimmed instructions and optional contact details', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const ui = await create(onSave);

  expect(ui.input('Access instructions').props.value).toBe(
    'Contact the branch.',
  );
  expect(ui.input('Contact person (optional)').props.value).toBe('Anita');
  expect(ui.input('Contact number (optional)').props.value).toBe('9876543210');
  await act(async () => {
    ui.input('Access instructions').props.onChangeText('  Visit the branch.  ');
    ui.input('Contact person (optional)').props.onChangeText('  Rohan  ');
    ui.input('Contact number (optional)').props.onChangeText('  12345  ');
  });
  await act(async () => {
    ui.button('Save access note').props.onPress();
  });

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({
      details: expect.objectContaining({
        accessInstruction: 'Visit the branch.',
        accessContactName: 'Rohan',
        accessContactPhone: '12345',
      }),
    }),
  );
  expect(ui.text()).toContain('Family access note saved');
  expect(ui.text()).toContain('Your instructions are saved with Home loan.');
  expect(ui.text()).toContain(
    'This note is shared with trusted people only when you choose to send a handoff.',
  );
  expect(ui.button('Back to loan')).toBeDefined();
  expect(ui.onClose).not.toHaveBeenCalled();
  await act(async () => {
    ui.button('Back to loan').props.onPress();
  });
  expect(ui.onClose).toHaveBeenCalledTimes(1);
});

it('requires instructions and leaves the screen open when saving fails', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('Offline'));
  const ui = await create(onSave);

  await act(async () => {
    ui.input('Access instructions').props.onChangeText('   ');
  });
  await act(async () => {
    ui.button('Save access note').props.onPress();
  });

  expect(onSave).not.toHaveBeenCalled();
  expect(ui.text()).toContain(
    'Add instructions for your family before saving.',
  );
  expect(ui.onClose).not.toHaveBeenCalled();

  await act(async () => {
    ui.input('Access instructions').props.onChangeText('Call the lender.');
  });
  await act(async () => {
    ui.button('Save access note').props.onPress();
  });

  expect(ui.text()).toContain('Offline');
  expect(ui.onClose).not.toHaveBeenCalled();
});

it('cancels without saving', async () => {
  const onSave = jest.fn();
  const ui = await create(onSave);

  await act(async () => {
    ui.button('Cancel').props.onPress();
  });

  expect(onSave).not.toHaveBeenCalled();
  expect(ui.onClose).toHaveBeenCalledTimes(1);
});

it('builds a partial update without dropping existing loan data', () => {
  expect(
    buildLoanAccessNotePayload(
      record,
      '  Call the lender. ',
      ' Rohan ',
      ' 12345 ',
    ),
  ).toEqual({
    type: 'LOAN_TAKEN',
    title: 'Home loan',
    details: {
      ...record.details,
      accessInstruction: 'Call the lender.',
      accessContactName: 'Rohan',
      accessContactPhone: '12345',
    },
    notes: 'Existing general notes',
    followUpDate: '2026-12-01',
    followUpNote: 'Review EMI',
    attachmentDocumentIds: ['document-1'],
  });
});
