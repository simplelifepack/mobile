import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import {
  WealthEmptyOverview,
  WealthEmptyOverviewActions,
} from './WealthEmptyOverview';

async function renderEmptyOverview(tabBarHeight = 0) {
  const onOpenCategory = jest.fn();
  const onAddFirstEntry = jest.fn();
  const onManageTrustedPeople = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <BottomTabBarHeightContext.Provider value={tabBarHeight}>
          <>
            <WealthEmptyOverview onOpenCategory={onOpenCategory} />
            <WealthEmptyOverviewActions
              guestPreview={false}
              onAddFirstEntry={onAddFirstEntry}
              onManageTrustedPeople={onManageTrustedPeople}
            />
          </>
        </BottomTabBarHeightContext.Provider>
      </AppThemeProvider>,
    );
  });
  return {
    renderer,
    onOpenCategory,
    onAddFirstEntry,
    onManageTrustedPeople,
  };
}

it('shows the designed empty state and category summaries', async () => {
  const ui = await renderEmptyOverview();
  const labels = ui.renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children);

  expect(labels).toContain('Accounts and investments');
  expect(labels).toContain('Insurance');
  expect(labels).toContain('Loans');
  expect(labels).toContain('Lent and borrowed');
  expect(labels).toContain('Your family’s starting point');
  expect(labels).toContain('No holdings yet');
  expect(labels).toContain('No entries added');
  expect(labels).toContain('No policies added');
  expect(labels).toContain('No loans added');
  expect(labels).toContain('No transactions added');
  expect(labels).toContain('SOS handoff');
  expect(labels).toContain('Available after your first entry');
  expect(labels).toContain(
    'SOS handoff becomes available after your first entry. You can add trusted people now.',
  );
  const handoffButton = ui.renderer.root.findByProps({
    accessibilityLabel: 'SOS handoff',
  });
  expect(handoffButton.props.disabled).toBe(true);
  expect(handoffButton.props.accessibilityState).toEqual({ disabled: true });
});

it('opens the selected category and runs both bottom actions', async () => {
  const ui = await renderEmptyOverview();

  await act(async () => {
    ui.renderer.root
      .findByProps({
        accessibilityLabel: 'Insurance',
      })
      .props.onPress();
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Add your first entry')!
      .props.onPress();
    ui.renderer.root
      .findAllByType(Button)
      .find(button => button.props.title === 'Manage trusted people')!
      .props.onPress();
  });

  expect(ui.onOpenCategory).toHaveBeenCalledWith('Insurance');
  expect(ui.onAddFirstEntry).toHaveBeenCalledTimes(1);
  expect(ui.onManageTrustedPeople).toHaveBeenCalledTimes(1);
});

it('positions empty-state actions above the tab bar', async () => {
  const ui = await renderEmptyOverview(80);
  const actionContainer = ui.renderer.root
    .findAllByType(View)
    .find(node => StyleSheet.flatten(node.props.style)?.position === 'absolute');

  expect(StyleSheet.flatten(actionContainer?.props.style)?.bottom).toBe(92);
});
