import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Appearance, useColorScheme } from 'react-native';
import { AppThemeProvider, useAppTheme } from './ThemeProvider';
import type { ThemeMode } from './types';
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Appearance: { setColorScheme: jest.fn() },
  useColorScheme: jest.fn(),
}));
let current: ReturnType<typeof useAppTheme>;
function Probe() {
  current = useAppTheme();
  return null;
}
it('follows device changes in System and clears explicit native overrides when returning to System', async () => {
  const scheme = useColorScheme as jest.Mock;
  scheme.mockReturnValue('dark');
  let root: TestRenderer.ReactTestRenderer;
  await act(async () => {
    root = TestRenderer.create(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    );
  });
  expect(current!.mode).toBe('system');
  expect(current!.theme.isDark).toBe(true);
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('auto');
  const changeMode = async (mode: ThemeMode) => {
    await act(async () => current!.setMode(mode));
  };
  await changeMode('light');
  expect(current!.theme.isDark).toBe(false);
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('light');
  await changeMode('system');
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('auto');
  scheme.mockReturnValue('light');
  await act(async () =>
    root!.update(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    ),
  );
  expect(current!.mode).toBe('system');
  expect(current!.theme.isDark).toBe(false);
  scheme.mockReturnValue('dark');
  await act(async () =>
    root!.update(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    ),
  );
  expect(current!.theme.isDark).toBe(true);
  await changeMode('dark');
  expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('dark');
  await act(async () => root!.unmount());
});
