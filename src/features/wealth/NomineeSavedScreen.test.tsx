import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import type { NomineeInformation } from './NomineeInformationScreen';
import { NomineeSavedScreen } from './NomineeSavedScreen';

const nominee: NomineeInformation = {
  name: 'Venkat Rao',
  relationship: 'Spouse',
  phone: '+91 98450 12345',
  allocation: '100',
  registrationStatus: 'Registered with institution',
};

async function renderScreen() {
  const onAddAccessNote = jest.fn();
  const onBackToHolding = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <NomineeSavedScreen
          visible
          nominee={nominee}
          holdingName="HDFC Savings"
          accountReference="4821"
          institution="HDFC"
          accessNote=""
          userName="Divya"
          onAddAccessNote={onAddAccessNote}
          onBackToHolding={onBackToHolding}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onAddAccessNote, onBackToHolding };
}

it('shows the saved nominee, holding registration, and missing access note', async () => {
  const ui = await renderScreen();
  const text = ui.renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');

  expect(text).toContain('Nominee saved');
  expect(text).toContain('Nominee information updated');
  expect(text).toMatch(/Venkat Rao · Spouse · 100\s?%/);
  expect(text).toContain('HDFC Savings · 4821');
  expect(text).toContain('Recorded as registered with HDFC');
  expect(text).toContain('Add instructions to complete this holding');
});

it('offers actions to add an access note or return to the holding', async () => {
  const ui = await renderScreen();

  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Add access note')!
      .props.onPress();
  });
  expect(ui.onAddAccessNote).toHaveBeenCalledTimes(1);

  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Back to holding')!
      .props.onPress();
  });
  expect(ui.onBackToHolding).toHaveBeenCalledTimes(1);
});
