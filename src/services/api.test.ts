import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import { packagesApi } from '../api/packages.api';
jest.mock('../api/packages.api', () => ({
  packagesApi: { list: jest.fn(), get: jest.fn() },
}));
it('keeps package pages and limits independent instead of merging cumulative arrays twice', async () => {
  jest.useFakeTimers();
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: get => get().concat(api.middleware),
  });
  (packagesApi.list as jest.Mock).mockImplementation(async query => ({
    items: [{ slug: `page-${query.page}-limit-${query.limit}` }],
    pagination: { page: query.page, hasNextPage: true },
  }));
  const one = store.dispatch(
    api.endpoints.packages.initiate({ page: 1, limit: 20 }),
  );
  const two = store.dispatch(
    api.endpoints.packages.initiate({ page: 2, limit: 20 }),
  );
  const otherSize = store.dispatch(
    api.endpoints.packages.initiate({ page: 1, limit: 10 }),
  );
  try {
    expect((await one.unwrap()).items.map(item => item.slug)).toEqual([
      'page-1-limit-20',
    ]);
    expect((await two.unwrap()).items.map(item => item.slug)).toEqual([
      'page-2-limit-20',
    ]);
    expect((await otherSize.unwrap()).items.map(item => item.slug)).toEqual([
      'page-1-limit-10',
    ]);
    const cached = store.dispatch(
      api.endpoints.packages.initiate({ page: 1, limit: 20 }),
    );
    await cached.unwrap();
    cached.unsubscribe();
    expect(packagesApi.list).toHaveBeenCalledTimes(3);
  } finally {
    one.unsubscribe();
    two.unsubscribe();
    otherSize.unsubscribe();
    store.dispatch(api.util.resetApiState());
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
