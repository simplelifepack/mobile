import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { accountApi } from '../../api/account.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { SubscriptionScreen } from './SubscriptionScreen';

jest.mock('../../api/account.api', () => ({ accountApi: { usage: jest.fn() } }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('../../components/primitives/Screen', () => ({
  Screen: ({ children }: React.PropsWithChildren) => children,
}));

it('shows actual account status and keeps all purchase actions disabled', async () => {
  jest.mocked(accountApi.usage).mockResolvedValue({
    accountTier: 'paid',
    storage: { usedBytes: 0, limitBytes: null, unlimited: true },
    aiUsage: { used: null, limit: null, remaining: null, unlimited: true, period: '2026-01' },
  });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><SubscriptionScreen /></AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(AppText).some(node => node.props.children === 'Paid account')).toBe(true);
  const buttons = renderer.root.findAllByType(Button);
  expect(buttons).toHaveLength(3);
  expect(buttons.every(button => button.props.disabled)).toBe(true);
  expect(buttons.every(button => !button.props.onPress)).toBe(true);
});

it('shows an error instead of assuming a free account when status cannot load', async () => {
  jest.mocked(accountApi.usage).mockRejectedValue(new Error('Network unavailable'));
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><SubscriptionScreen /></AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(AppText).some(node => node.props.children === 'Network unavailable')).toBe(true);
  expect(renderer.root.findAllByType(AppText).some(node => node.props.children === 'Account status unavailable')).toBe(true);
});
