import React from 'react';
import { Text } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Skeleton } from '../../components/feedback/Skeleton';
import { AccentLoader } from '../../components/primitives/AccentLoader';
import { HomeDataState } from './HomeDataState';
it('never replaces Home content with skeletons during initial loading or refresh', async () => {
  let tree!: Renderer.ReactTestRenderer;
  const render = (loading: boolean, refreshing: boolean) => (
    <AppThemeProvider>
      <HomeDataState loading={loading} refreshing={refreshing}>
        <Text>Loaded account overview</Text>
      </HomeDataState>
    </AppThemeProvider>
  );
  await act(async () => {
    tree = Renderer.create(render(true, false));
  });
  expect(tree.root.findAllByType(Skeleton)).toHaveLength(0);
  expect(tree.root.findAllByType(AccentLoader)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('Loaded account overview');
  await act(async () => tree.update(render(false, true)));
  expect(tree.root.findAllByType(Skeleton)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('Refreshing your overview…');
  expect(JSON.stringify(tree.toJSON())).toContain('Loaded account overview');
  await act(async () => tree.update(render(false, false)));
  expect(tree.root.findAllByType(Skeleton)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('Loaded account overview');
  await act(async () => tree.unmount());
});
