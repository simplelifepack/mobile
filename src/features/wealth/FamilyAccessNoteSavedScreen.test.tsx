import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { FamilyAccessNoteSavedScreen } from './FamilyAccessNoteSavedScreen';

async function renderScreen() {
  const onViewHolding = jest.fn();
  const onBackToWealth = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <FamilyAccessNoteSavedScreen
          visible
          holdingName="HDFC Savings"
          userName="Divya"
          onViewHolding={onViewHolding}
          onBackToWealth={onBackToWealth}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onViewHolding, onBackToWealth };
}

it('confirms the access note and explains privacy until handoff', async () => {
  const ui = await renderScreen();
  const text = ui.renderer.root
    .findAllByType(AppText)
    .map(item => item.props.children)
    .flat()
    .join(' ')
    .replace(/\s+/g, ' ');

  expect(text).toContain('Access note saved');
  expect(text).toContain('Your family knows the next step');
  expect(text).toContain('Instructions have been added to HDFC Savings');
  expect(text).toContain('HDFC Savings is family-ready');
  expect(text).toContain(
    'Holding details, nominee and access note stay together.',
  );
  expect(text).toContain('Private until handoff');
  expect(text).toContain(
    'Your trusted people will see this note only when you choose to send a handoff.',
  );
});

it('offers view-holding and back-to-wealth actions', async () => {
  const ui = await renderScreen();
  const buttons = ui.renderer.root.findAllByType(Button);

  await act(async () => {
    buttons
      .find(button => button.props.title === 'View holding')!
      .props.onPress();
  });
  expect(ui.onViewHolding).toHaveBeenCalledTimes(1);

  await act(async () => {
    buttons
      .find(button => button.props.title === 'Back to Wealth')!
      .props.onPress();
  });
  expect(ui.onBackToWealth).toHaveBeenCalledTimes(1);
});
