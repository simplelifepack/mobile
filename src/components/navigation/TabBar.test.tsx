import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { lightColorTokens } from '../../design/tokens/colorTokens';
import { PrimaryNavigation } from './TabBar';
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
it('preserves native shadow tokens without CSS parsing warnings', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  let root!: Renderer.ReactTestRenderer;
  try {
    await act(async () => {
      root = Renderer.create(
        <AppThemeProvider>
          <PrimaryNavigation active="Home" onSelect={() => undefined} />
        </AppThemeProvider>,
      );
    });
    const tree = root.toJSON() as Renderer.ReactTestRendererJSON;
    expect(StyleSheet.flatten(tree.props.style)).toEqual(
      expect.objectContaining({
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
        elevation: 5,
        shadowOpacity: 1,
        shadowColor: lightColorTokens['shadow-strong'],
      }),
    );
    expect(warn).not.toHaveBeenCalled();
  } finally {
    await act(async () => {
      root.unmount();
    });
    warn.mockRestore();
  }
});
