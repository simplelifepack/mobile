import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';
import { AppThemeProvider } from '../design/theme/ThemeProvider';
import { SessionGuard } from './SessionGuard';
import { setSessionGate } from './sessionGate';
jest.mock('../features/auth/screens/ReauthenticateScreen', () => ({
  ReauthenticateScreen: () =>
    require('react').createElement(
      require('react-native').Text,
      null,
      'Sign in to resume',
    ),
}));
it('hides protected content from touch and accessibility without destroying open form state', async () => {
  let edit!: (value: string) => void;
  let mounts = 0;
  function Form() {
    const [value, setValue] = React.useState('');
    edit = setValue;
    React.useEffect(() => {
      mounts++;
    }, []);
    return <Text>{value}</Text>;
  }
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <SessionGuard>
          <Form />
        </SessionGuard>
      </AppThemeProvider>,
    );
  });
  await act(async () => edit('Unsaved work'));
  await act(async () => setSessionGate('owner@example.test'));
  expect(JSON.stringify(tree.toJSON())).toContain('Sign in to resume');
  expect(
    tree.root
      .findAllByType(View)
      .some(
        node =>
          node.props.pointerEvents === 'none' &&
          node.props.accessibilityElementsHidden === true,
      ),
  ).toBe(true);
  await act(async () => setSessionGate(null));
  expect(JSON.stringify(tree.toJSON())).toContain('Unsaved work');
  expect(mounts).toBe(1);
  await act(async () => tree.unmount());
});
