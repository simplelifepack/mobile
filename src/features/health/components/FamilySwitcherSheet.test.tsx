import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Modal, ScrollView } from 'react-native';
import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { FamilySwitcherSheet } from './FamilySwitcherSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));

const members: HealthMember[] = [
  { id: 'one', name: 'Divya', relation: 'self', createdAt: '', updatedAt: '' },
  { id: 'two', name: 'Alex', relation: 'parent', createdAt: '', updatedAt: '' },
];

it('marks the active member and routes selection, close, and family management', async () => {
  const onSelect = jest.fn();
  const onClose = jest.fn();
  const onManageFamily = jest.fn();
  const onDismiss = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <FamilySwitcherSheet visible members={members} selected="one" onSelect={onSelect}
        onClose={onClose} onManageFamily={onManageFamily} onDismiss={onDismiss} />
    </AppThemeProvider>);
  });
  const radios = renderer.root.findAllByProps({ accessibilityRole: 'radio' }).filter(item => typeof item.props.onPress === 'function');
  expect(radios).toHaveLength(2);
  expect(radios[0].props.accessibilityState.checked).toBe(true);
  expect(radios[1].props.accessibilityState.checked).toBe(false);
  expect(radios[1].props.accessibilityLabel).toBe('Alex, Parent');
  expect(renderer.root.findAllByType(ScrollView).length).toBeGreaterThan(0);
  const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  const manage = buttons.find(item => item.findAllByType(AppText).some(text => text.props.children === 'Manage family'))!;
  await act(async () => {
    radios[1].props.onPress();
    manage.props.onPress();
    buttons.find(item => item.props.accessibilityLabel === 'Close family switcher')!.props.onPress();
    renderer.root.findByType(Modal).props.onRequestClose();
    renderer.root.findByType(Modal).props.onDismiss();
  });
  expect(onSelect).toHaveBeenCalledWith('two');
  expect(onManageFamily).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(2);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('shows an empty state and keeps family management available', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <FamilySwitcherSheet visible members={[]} selected="" onSelect={jest.fn()}
        onClose={jest.fn()} onManageFamily={jest.fn()} />
    </AppThemeProvider>);
  });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toContain('No health profiles yet.');
  expect(labels).toContain('Manage family');
});
