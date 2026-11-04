import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppState, type AppStateStatus } from 'react-native';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Toggle } from '../../components/primitives/Toggle';
import { appLockStorage } from '../../security/appLockStorage';
import { AppLockSettings } from './AppLockSettings';
const mockDispatch = jest.fn();
const mockLock = { enabled: false, biometrics: false, ready: true };
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ auth: { user: { id: 'qa' } }, appLock: mockLock }),
  useAppDispatch: () => mockDispatch,
}));
jest.mock('../shared/FeatureUI', () => ({
  AppText: require('../../components/primitives/AppText').AppText,
  useAction: require('../shared/resourceHooks').useAction,
}));
jest.mock('../../security/appLockStorage', () => ({
  appLockStorage: {
    supportedBiometry: jest.fn(),
    enableBiometry: jest.fn(),
    save: jest.fn(),
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockLock.enabled = false;
  (appLockStorage.supportedBiometry as jest.Mock).mockResolvedValue(null);
});
afterEach(() => jest.restoreAllMocks());
async function render() {
  let root!: Renderer.ReactTestRenderer;
  await act(async () => {
    root = Renderer.create(
      <AppThemeProvider>
        <AppLockSettings />
      </AppThemeProvider>,
    );
  });
  return root;
}
it('lets the biometric control check availability and explains missing enrollment without saving', async () => {
  (appLockStorage.enableBiometry as jest.Mock).mockRejectedValue(
    new Error('Set up Face ID in device Settings first.'),
  );
  const root = await render();
  const toggle = root.root.findAllByType(Toggle)[1];
  expect(toggle.props.disabled).toBe(false);
  await act(async () => toggle.props.onValueChange(true));
  expect(appLockStorage.enableBiometry).toHaveBeenCalledWith('qa');
  expect(appLockStorage.save).not.toHaveBeenCalled();
  expect(JSON.stringify(root.toJSON())).toContain(
    'Set up Face ID in device Settings first.',
  );
  await act(async () => root.unmount());
});
it('enables app lock together with successfully verified biometrics', async () => {
  (appLockStorage.enableBiometry as jest.Mock).mockResolvedValue(undefined);
  (appLockStorage.save as jest.Mock).mockResolvedValue({
    enabled: true,
    biometrics: true,
  });
  const root = await render();
  await act(async () =>
    root.root.findAllByType(Toggle)[1].props.onValueChange(true),
  );
  expect(appLockStorage.save).toHaveBeenCalledWith('qa', {
    enabled: true,
    biometrics: true,
  });
  expect(mockDispatch).toHaveBeenCalledWith({
    type: 'appLock/lockSettingsChanged',
    payload: { accountId: 'qa', enabled: true, biometrics: true },
  });
  await act(async () => root.unmount());
});
it('refreshes availability after returning from device Settings and removes the listener', async () => {
  let onChange!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, handler) => {
      onChange = handler;
      return { remove };
    });
  const root = await render();
  (appLockStorage.supportedBiometry as jest.Mock).mockResolvedValue('FaceID');
  await act(async () => onChange('active'));
  expect(JSON.stringify(root.toJSON())).toContain(
    'Use FaceID instead of your R-pin.',
  );
  await act(async () => root.unmount());
  expect(remove).toHaveBeenCalled();
});
