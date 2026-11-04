import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StartupSplash } from './StartupSplash';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { Skeleton } from '../../components/feedback/Skeleton';
import { BrandMark } from '../../components/navigation/BrandMark';
jest.mock('../../components/primitives/AccentLoader', () => ({
  AccentLoader: () => null,
}));
it('shows the real brand and startup status instead of content skeletons', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <StartupSplash />
      </AppThemeProvider>,
    );
  });
  expect(tree.root.findByType(BrandMark).props.size).toBe(84);
  expect(tree.root.findAllByType(Skeleton)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).not.toContain('Opening');
  expect(JSON.stringify(tree.toJSON())).toContain(
    'Everything important, in one place.',
  );
  await act(async () => tree.unmount());
});
