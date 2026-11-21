import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  NomineeInformationScreen,
  type NomineeInformation,
} from './NomineeInformationScreen';

const initialValue: NomineeInformation = {
  name: '',
  relationship: '',
  phone: '',
  allocation: '100',
  registrationStatus: '',
};

async function renderScreen(onSave = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <NomineeInformationScreen
          visible
          holdingName="HDFC Savings"
          accountReference="•••• 4821"
          initialValue={initialValue}
          userName="Divya Rao"
          onClose={jest.fn()}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onSave };
}

it('shows holding context, required nominee fields and legal-record disclosure', async () => {
  const ui = await renderScreen();
  const text = ui.renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');

  expect(text).toContain('Nominee information');
  expect(text).toContain('HDFC Savings · •••• 4821');
  expect(text).toContain(
    'If more than one nominee, allocations must total 100%.',
  );
  expect(text).toContain('A record, not a nomination');
  expect(text).toContain(
    'Saving here records the details for your family. It does not register or change a legal nomination with the institution.',
  );
});

it('validates required fields and allocation before saving locally', async () => {
  const ui = await renderScreen();
  const saveButton = () =>
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Save nominee')!;

  await act(async () => {
    saveButton().props.onPress();
  });
  expect(ui.onSave).not.toHaveBeenCalled();
  expect(
    ui.renderer.root
      .findAllByType(AppText)
      .some(item =>
        JSON.stringify(item.props.children).includes('nominee’s full name'),
      ),
  ).toBe(true);

  await act(async () => {
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Full name' })
      .props.onChangeText('  Venkat Rao  ');
  });
  await act(async () => {
    ui.renderer.root;
    saveButton().props.onPress();
  });
  expect(ui.onSave).not.toHaveBeenCalled();

  await act(async () => {
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Relationship' })
      .props.onChangeText('Spouse');
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Allocation' })
      .props.onChangeText('101');
  });
  await act(async () => {
    saveButton().props.onPress();
  });
  expect(ui.onSave).not.toHaveBeenCalled();

  await act(async () => {
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Allocation' })
      .props.onChangeText('100');
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Phone (optional)' })
      .props.onChangeText('+91 98450 12345');
    ui.renderer.root
      .findByProps({ accessibilityLabel: 'Registration status' })
      .props.onChangeText('Registered with institution');
  });
  await act(async () => {
    saveButton().props.onPress();
  });
  expect(ui.onSave).toHaveBeenCalledWith({
    name: 'Venkat Rao',
    relationship: 'Spouse',
    phone: '+91 98450 12345',
    allocation: '100',
    registrationStatus: 'Registered with institution',
  });
});

it('closes without saving when cancelled', async () => {
  const onClose = jest.fn();
  const onSave = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <NomineeInformationScreen
          visible
          holdingName="HDFC Savings"
          accountReference="•••• 4821"
          initialValue={initialValue}
          onClose={onClose}
          onSave={onSave}
        />
      </AppThemeProvider>,
    );
  });

  await act(async () => {
    renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Cancel')!
      .props.onPress();
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});
