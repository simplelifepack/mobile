import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  FamilyAccessNoteScreen,
  type FamilyAccessNote,
} from './FamilyAccessNoteScreen';

const initialValue: FamilyAccessNote = {
  instructions: '',
  contactPerson: '',
  contactNumber: '',
};

async function renderScreen() {
  const onClose = jest.fn();
  const onSave = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <FamilyAccessNoteScreen
          visible
          holdingName="HDFC Savings"
          accountReference="4821"
          userName="Divya"
          initialValue={initialValue}
          onClose={onClose}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onClose, onSave };
}

it('shows holding context, access fields, and credential safety warning', async () => {
  const ui = await renderScreen();
  const text = ui.renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');

  expect(text).toContain('Family access note');
  expect(text).toContain('HDFC Savings · 4821');
  expect(text).toContain(
    'Include the institution, location, documents and next steps.',
  );
  expect(text).toContain('Never save secret credentials');
  expect(text).toContain(
    'Do not include passwords, PINs, security answers, OTPs, or other secret credentials.',
  );
});

it('requires instructions and saves trimmed note and optional contact details', async () => {
  const ui = await renderScreen();
  const saveButton = () =>
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Save access note')!;

  await act(async () => {
    saveButton().props.onPress();
  });
  expect(ui.onSave).not.toHaveBeenCalled();
  expect(
    ui.renderer.root
      .findAllByType(AppText)
      .some(text =>
        JSON.stringify(text.props.children).includes(
          'Add instructions for your family before saving.',
        ),
      ),
  ).toBe(true);

  await act(async () => {
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Access instructions' })
      .props.onChangeText('  Visit the Indiranagar branch with ID.  ');
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Contact person (optional)' })
      .props.onChangeText('  Priya  ');
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Contact number (optional)' })
      .props.onChangeText('  +91 80 4000 1234  ');
  });
  await act(async () => {
    saveButton().props.onPress();
  });

  expect(ui.onSave).toHaveBeenCalledWith({
    instructions: 'Visit the Indiranagar branch with ID.',
    contactPerson: 'Priya',
    contactNumber: '+91 80 4000 1234',
  });
});

it('cancels without saving', async () => {
  const ui = await renderScreen();
  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Cancel')!
      .props.onPress();
  });
  expect(ui.onClose).toHaveBeenCalledTimes(1);
  expect(ui.onSave).not.toHaveBeenCalled();
});
