import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { mobileApi } from '../../api/mobile.api';
import { useGlobalSearch } from './useGlobalSearch';
import type { GlobalSearchResponse } from '../../api/web.types';
jest.mock('../../api/mobile.api', () => ({ mobileApi: { search: jest.fn() } }));
const search = mobileApi.search as jest.Mock;
let latest!: ReturnType<typeof useGlobalSearch>;
function Harness({
  query,
  account = 'user',
}: {
  query: string;
  account?: string;
}) {
  latest = useGlobalSearch(query, account);
  return null;
}
const response = (title: string): GlobalSearchResponse => ({
  query: title,
  groups: [
    {
      section: 'documents',
      label: 'Documents',
      results: [
        {
          id: title,
          title,
          subtitle: 'Identity',
          section: 'documents',
          navigation: { path: `/documents/identity/${title}` },
        },
      ],
    },
  ],
});
beforeEach(() => {
  jest.useFakeTimers();
  search.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});
it('searches as you type, cancels stale requests, and clears results for empty input', async () => {
  const resolve: Array<(value: GlobalSearchResponse) => void> = [];
  search.mockImplementation(() => new Promise(r => resolve.push(r)));
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Harness query="a" />);
  });
  await act(async () => {
    jest.advanceTimersByTime(100);
    tree.update(<Harness query="aadhaar" />);
  });
  expect(search).not.toHaveBeenCalled();
  await act(async () => {
    jest.advanceTimersByTime(220);
  });
  expect(search).toHaveBeenCalledWith('aadhaar', 10, expect.any(AbortSignal));
  const firstSignal = search.mock.calls[0][2] as AbortSignal;
  await act(async () => {
    tree.update(<Harness query="passport" />);
    jest.advanceTimersByTime(220);
  });
  expect(firstSignal.aborted).toBe(true);
  await act(async () => {
    jest.advanceTimersByTime(220);
    resolve[0](response('stale'));
  });
  expect(latest.groups).toEqual([]);
  await act(async () => {
    resolve[1](response('Passport'));
  });
  expect(latest.groups[0].results[0].title).toBe('Passport');
  await act(async () => {
    tree.update(<Harness query="  " />);
  });
  expect(latest.status).toBe('idle');
  expect(latest.groups).toEqual([]);
  expect((search.mock.calls[1][2] as AbortSignal).aborted).toBe(true);
  await act(async () => tree.unmount());
});
it('offers retry after failure and aborts on unmount or account switch', async () => {
  search
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValue(response('Passport'));
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(<Harness query="passport" />);
  });
  await act(async () => {
    jest.advanceTimersByTime(220);
  });
  expect(latest.status).toBe('failed');
  expect(latest.error).toBe('Network unavailable');
  await act(async () => latest.retry());
  await act(async () => {
    jest.advanceTimersByTime(220);
  });
  expect(latest.status).toBe('succeeded');
  await act(async () =>
    tree.update(<Harness query="passport" account="other" />),
  );
  expect(latest.groups).toEqual([]);
  await act(async () => {
    jest.advanceTimersByTime(220);
  });
  const signal = search.mock.calls[2][2] as AbortSignal;
  await act(async () => tree.unmount());
  expect(signal.aborted).toBe(true);
});
