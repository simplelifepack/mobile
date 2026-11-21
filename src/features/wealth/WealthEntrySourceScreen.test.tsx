import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  WealthEntrySourceScreen,
  type WealthEntryKind,
  type WealthEntrySource,
} from './WealthEntrySourceScreen';

async function renderScreen(kind: WealthEntryKind) {
  const onClose = jest.fn();
  const onSelectSource = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <WealthEntrySourceScreen
          visible
          kind={kind}
          userName="Divya"
          onClose={onClose}
          onSelectSource={onSelectSource}
        />
      </AppThemeProvider>,
    );
  });
  return { renderer, onClose, onSelectSource };
}

it.each([
  ['asset', 'Add account'],
  ['investment', 'Add account'],
  ['insurance', 'Add insurance'],
  ['loan', 'Add loan'],
  ['transaction', 'Add transaction'],
] as const)(
  'shows the shared source choices for %s entries',
  async (kind, title) => {
    const ui = await renderScreen(kind);
    const text = ui.renderer.root
      .findAllByType(AppText)
      .map(item => item.props.children)
      .flat()
      .join(' ')
      .replace(/\s+/g, ' ');

    expect(text).toContain(title);
    expect(text).toContain('How would you like to start?');
    expect(text).toContain('Use an existing document');
    expect(text).toContain('Upload a document');
    expect(text).toContain('Enter details manually');
  },
);

it.each([
  ['Use an existing document', 'vault'],
  ['Upload a document', 'upload'],
  ['Enter details manually', 'manual'],
] as const)(
  'selects the %s source',
  async (label, source: WealthEntrySource) => {
    const ui = await renderScreen('asset');
    await act(async () => {
      ui.renderer.root
        .findByProps({ accessibilityLabel: label })
        .props.onPress();
    });
    expect(ui.onSelectSource).toHaveBeenCalledWith(source);
  },
);

it('returns from the source screen to entry types', async () => {
  const ui = await renderScreen('asset');
  await act(async () => {
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Back to entry types')!
      .props.onPress();
  });
  expect(ui.onClose).toHaveBeenCalledTimes(1);
});
