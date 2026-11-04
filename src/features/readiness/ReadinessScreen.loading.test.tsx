import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { ReadinessScreen } from './ReadinessScreen';
import { PackageListSkeleton } from './PackageListSkeleton';

let mockPackages: Record<string, unknown>;
const mockBootstrap = {
  data: { documents: [] },
  isLoading: false,
  refetch: jest.fn(),
};
jest.mock('../../services/api', () => ({
  usePackagesQuery: () => mockPackages,
  useBootstrapQuery: () => mockBootstrap,
  usePackageDetailQuery: () => ({}),
  useGeneratePackageMutation: () => [jest.fn(), {}],
  api: { util: { invalidateTags: jest.fn() } },
}));
jest.mock('../../app/store/hooks', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: null } }),
}));
jest.mock('../shared/FeatureUI', () => ({
  ...jest.requireActual('../shared/FeatureUI'),
  FeaturePage: ({ children }: React.PropsWithChildren) => children,
  useAction: () => ({ busy: false, message: '', run: jest.fn() }),
}));
jest.mock('./CustomPackage', () => ({ CustomPackage: () => null }));
jest.mock('../shared/RecordForm', () => ({ ActiveForm: () => null }));

const empty = { items: [], pagination: { total: 0, hasNextPage: false } };
it('shows skeletons through initial load and refresh, and shows empty only after completion', async () => {
  mockPackages = { isLoading: true, isFetching: true };
  let tree!: Renderer.ReactTestRenderer;
  const screen = () => (
    <AppThemeProvider>
      <ReadinessScreen />
    </AppThemeProvider>
  );
  await act(async () => {
    tree = Renderer.create(screen());
  });
  expect(tree.root.findAllByType(PackageListSkeleton)).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).not.toContain('No matching packages');
  // A new category or refresh may have data from an older query but no currentData.
  mockPackages = { isLoading: false, isFetching: true, data: empty };
  await act(async () => {
    tree.update(screen());
  });
  expect(tree.root.findAllByType(PackageListSkeleton)).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).not.toContain(
    'No packages are available',
  );
  mockPackages = {
    isLoading: false,
    isFetching: false,
    data: empty,
    currentData: empty,
  };
  await act(async () => {
    tree.update(screen());
  });
  expect(tree.root.findAllByType(PackageListSkeleton)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('No matching packages');
  const populated = {
    items: [
      {
        id: 'sample',
        slug: 'sample',
        title: 'Sample package',
        category: 'Education',
        requirements: [],
      },
    ],
    pagination: { total: 1, hasNextPage: false },
  };
  mockPackages = {
    isLoading: false,
    isFetching: true,
    data: populated,
    currentData: populated,
  };
  await act(async () => {
    tree.update(screen());
  });
  expect(tree.root.findAllByType(PackageListSkeleton)).toHaveLength(1);
  expect(JSON.stringify(tree.toJSON())).not.toContain('No matching packages');
  mockPackages = {
    isLoading: false,
    isFetching: false,
    data: populated,
    currentData: populated,
  };
  await act(async () => {
    tree.update(screen());
  });
  expect(tree.root.findAllByType(PackageListSkeleton)).toHaveLength(0);
  expect(JSON.stringify(tree.toJSON())).toContain('Sample package');
  await act(async () => {
    tree.unmount();
  });
});
