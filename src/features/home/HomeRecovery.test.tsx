import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { HomeRecovery } from './HomeRecovery';
import { Button } from '../../components/primitives/Button';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
jest.mock('../shared/FeatureUI', () => ({
  AppText: require('../../components/primitives/AppText').AppText,
  Button: require('../../components/primitives/Button').Button,
  Stack: require('../../components/primitives/Stack').Stack,
}));

it('shows one retry for multiple failures and retries only the failed sections', async () => {
  const health = jest.fn(),
    wealth = jest.fn(),
    documents = jest.fn();
  const sections = [
    { label: 'Health', error: 'timeout', loading: false, retry: health },
    { label: 'Wealth', error: 'timeout', loading: false, retry: wealth },
    { label: 'Documents', error: '', loading: false, retry: documents },
  ];
  let tree!: Renderer.ReactTestRenderer;
  const render = (items = sections) => (
    <AppThemeProvider>
      <HomeRecovery sections={items} />
    </AppThemeProvider>
  );
  await act(async () => {
    tree = Renderer.create(render());
  });
  expect(tree.root.findAllByType(Button)).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).toContain('Health, Wealth');
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(health).toHaveBeenCalledTimes(1);
  expect(wealth).toHaveBeenCalledTimes(1);
  expect(documents).not.toHaveBeenCalled();
  await act(async () =>
    tree.update(render(sections.map(item => ({ ...item, loading: true })))),
  );
  expect(tree.root.findByType(Button).props.disabled).toBe(true);
  await act(async () =>
    tree.update(render(sections.map(item => ({ ...item, error: '' })))),
  );
  expect(tree.root.findAllByType(Button)).toHaveLength(0);
  await act(async () => tree.unmount());
});
