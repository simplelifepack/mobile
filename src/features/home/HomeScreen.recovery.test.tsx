import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { HomeScreen } from './HomeScreen';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Button } from '../../components/primitives/Button';

const mockHealth = {
  data: { reminders: [], medications: [] },
  error: 'timeout',
  loading: false,
  revalidate: jest.fn(),
};
const mockWealth = {
  data: [],
  error: 'timeout',
  loading: false,
  revalidate: jest.fn(),
};
const mockPackages = {
  data: [],
  error: '',
  loading: false,
  revalidate: jest.fn(),
};
const mockBootstrap = {
  data: { documents: [] },
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: () => undefined,
}));
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { name: 'Test' } } }),
}));
jest.mock('../../services/api', () => ({
  useBootstrapQuery: () => mockBootstrap,
}));
jest.mock('../../components/navigation/AppHeader', () => ({
  AppHeader: () => null,
}));
jest.mock('../../api/mobile.api', () => ({
  mobileApi: {
    health: { homeAttention: jest.fn() },
    wealth: { records: jest.fn() },
  },
}));
jest.mock('../../api/packages.api', () => ({ packagesApi: {} }));
jest.mock('../shared/resourceHooks', () => ({
  useResource: (loader: unknown) => {
    const { mobileApi } = require('../../api/mobile.api');
    return loader === mobileApi.health.homeAttention
      ? mockHealth
      : loader === mobileApi.wealth.records
        ? mockWealth
        : mockPackages;
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));

it('keeps cached counts after a failed refresh and presents a single retry for both sections', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <HomeScreen />
      </AppThemeProvider>,
    );
  });
  const serialized = JSON.stringify(tree.toJSON());
  expect(serialized).toContain('Health, 0, tasks pending');
  expect(serialized).toContain('Wealth, 0, follow-ups due');
  expect(serialized).toContain('Some sections could not be refreshed');
  expect(serialized).not.toContain('No tasks need your attention.');
  const buttons = tree.root.findAllByType(Button);
  expect(buttons).toHaveLength(1);
  expect(buttons[0].props.title).toBe('Retry account data');
  await act(async () => buttons[0].props.onPress());
  expect(mockHealth.revalidate).toHaveBeenCalledTimes(1);
  expect(mockWealth.revalidate).toHaveBeenCalledTimes(1);
  expect(mockPackages.revalidate).not.toHaveBeenCalled();
  expect(mockBootstrap.refetch).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});

it('signals initial readiness once and never renders a local splash or skeleton', async () => {
  const savedHealthError = mockHealth.error,
    savedWealth = { ...mockWealth };
  mockHealth.error = '';
  Object.assign(mockWealth, { data: undefined, loading: true, error: '' });
  const ready = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <HomeScreen onInitialReady={ready} />
      </AppThemeProvider>,
    );
  });
  expect(
    tree.root.findAllByType(require('../startup/StartupSplash').StartupSplash),
  ).toHaveLength(0);
  expect(
    tree.root.findAllByType(
      require('../../components/feedback/Skeleton').Skeleton,
    ),
  ).toHaveLength(0);
  expect(ready).not.toHaveBeenCalled();
  Object.assign(mockWealth, { data: [], loading: false });
  await act(async () =>
    tree.update(
      <AppThemeProvider>
        <HomeScreen onInitialReady={ready} />
      </AppThemeProvider>,
    ),
  );
  expect(ready).toHaveBeenCalledTimes(1);
  expect(
    tree.root.findAllByType(require('../startup/StartupSplash').StartupSplash),
  ).toHaveLength(0);
  Object.assign(mockWealth, { loading: true, data: undefined });
  await act(async () =>
    tree.update(
      <AppThemeProvider>
        <HomeScreen onInitialReady={ready} />
      </AppThemeProvider>,
    ),
  );
  expect(
    tree.root.findAllByType(require('../startup/StartupSplash').StartupSplash),
  ).toHaveLength(0);
  expect(
    tree.root.findAllByType(
      require('../../components/feedback/Skeleton').Skeleton,
    ),
  ).toHaveLength(0);
  expect(ready).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
  mockHealth.error = savedHealthError;
  Object.assign(mockWealth, savedWealth);
});
