import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StartupSplash } from '../../features/startup/StartupSplash';
import { RootNavigator } from './RootNavigator';
import { useBootstrapQuery } from '../../services/api';
jest.mock('../../features/startup/StartupSplash', () => ({
  StartupSplash: () =>
    require('react').createElement('Text', null, 'Branded startup'),
}));
let mockAuthStatus = 'authenticated';
let mockLock = { ready: false, locked: false };
jest.mock('../../security/useAppLock', () => ({ useAppLock: () => mockLock }));
jest.mock('../store/hooks', () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({
      auth: { status: mockAuthStatus, user: { id: 'a', pinConfigured: true } },
      onboarding: { completed: true },
    }),
  useAppDispatch: () => jest.fn(),
}));
jest.mock('../store/store', () => ({
  store: { getState: () => ({ auth: { user: null } }) },
}));
jest.mock('./MainTabs', () => ({ MainTabs: () => null }));
jest.mock('../../services/api', () => ({ useBootstrapQuery: jest.fn() }));
jest.mock('../../api/preferences.api', () => ({
  preferencesApi: { get: jest.fn().mockResolvedValue({ appearance: 'light' }) },
}));
jest.mock('../../design/theme/ThemeProvider', () => ({
  useAppTheme: () => ({
    theme: require('../../design/theme/light').lightTheme,
    setMode: jest.fn(),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: React.PropsWithChildren) => children,
  createNavigationContainerRef: () => ({ isReady: () => false, dispatch: jest.fn() }),
  CommonActions: { navigate: jest.fn() },
}));
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: React.PropsWithChildren) => children,
    Screen: ({ name }: { name: string }) =>
      require('react').createElement('Text', { testID: name }, name),
  }),
}));
it.each([
  { ready: false, locked: false },
  { ready: false, locked: true },
  { ready: true, locked: true },
  { ready: true, locked: false },
])(
  'gates all archive screens and bootstrap while checking/unlocking: %p',
  async lock => {
    mockLock = lock;
    let root!: Renderer.ReactTestRenderer;
    await act(async () => {
      root = Renderer.create(<RootNavigator />);
    });
    const allowed = lock.ready && !lock.locked;
    if (!lock.ready)
      expect(root.root.findAllByType(StartupSplash)).toHaveLength(1);
    expect(
      root.root.findAll(node => node.props.testID === 'Main'),
    ).toHaveLength(allowed ? 1 : 0);
    expect(
      root.root.findAll(node => node.props.testID === 'Invitation'),
    ).toHaveLength(allowed ? 1 : 0);
    expect(useBootstrapQuery).toHaveBeenLastCalledWith(undefined, {
      skip: !allowed,
    });
    await act(async () => {
      root.unmount();
    });
  },
);

it('keeps one splash through the session-to-Home handoff until Home reports readiness', async () => {
  mockAuthStatus = 'restoring';
  mockLock = { ready: false, locked: false };
  let root!: Renderer.ReactTestRenderer;
  await act(async () => {
    root = Renderer.create(<RootNavigator />);
  });
  expect(root.root.findAllByType(StartupSplash)).toHaveLength(1);
  const splash = root.root.findByType(StartupSplash);
  mockAuthStatus = 'authenticated';
  await act(async () => root.update(<RootNavigator />));
  expect(root.root.findByType(StartupSplash)).toBe(splash);
  mockLock = { ready: true, locked: false };
  await act(async () => root.update(<RootNavigator />));
  expect(root.root.findByType(StartupSplash)).toBe(splash);
  const main = root.root.findAll(node => node.props.name === 'Main')[0];
  expect(main.props.options.animation).toBe('none');
  await act(async () => main.props.children().props.onInitialReady());
  expect(root.root.findAllByType(StartupSplash)).toHaveLength(0);
  await act(async () => root.unmount());
});
