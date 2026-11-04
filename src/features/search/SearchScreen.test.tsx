import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { SearchScreen } from './SearchScreen';
const mockBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockBack, navigate: mockNavigate }),
}));
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: () => 'synthetic-account',
}));
jest.mock('../../storage/searchHistoryStorage', () => ({
  searchHistoryStorage: { read: async () => [], write: async () => undefined },
}));
jest.mock('./useGlobalSearch', () => ({
  useGlobalSearch: () => ({
    status: 'succeeded',
    groups: [
      {
        section: 'documents',
        label: 'Documents',
        results: [
          {
            id: 'synthetic-document',
            title: 'Synthetic document',
            subtitle: 'Test result',
            section: 'documents',
            navigation: { path: '/documents/view/synthetic-document' },
          },
        ],
      },
    ],
    error: '',
    retry: jest.fn(),
  }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
it('dismisses the overlay before opening a result and offers Back without a second search action', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <SearchScreen route={{ params: { query: 'synthetic' } }} />
      </AppThemeProvider>,
    );
  });
  const target = (label: string) =>
    tree.root.findAll(
      node =>
        node.props.accessibilityLabel === label &&
        typeof node.props.onPress === 'function',
    )[0];
  await act(async () => {
    target('Open Synthetic document').props.onPress();
  });
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('DocumentLibrary', {
    documentId: 'synthetic-document',
  });
  expect(mockBack.mock.invocationCallOrder[0]).toBeLessThan(
    mockNavigate.mock.invocationCallOrder[0],
  );
  await act(async () => {
    target('Back from search').props.onPress();
  });
  expect(mockBack).toHaveBeenCalledTimes(2);
  expect(tree.root.findAll(node => node.props.title === 'Search')).toHaveLength(
    0,
  );
  await act(async () => {
    tree.unmount();
  });
});
