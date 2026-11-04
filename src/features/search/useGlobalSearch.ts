import { describeIssue, type Issue } from '../../components/feedback/issue';
import { correctedSearch } from './searchRecovery';
import { useEffect, useReducer, useState } from 'react';
import { mobileApi } from '../../api/mobile.api';
import type { GlobalSearchGroup } from '../../api/web.types';
type SearchState = {
  query: string;
  accountId?: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  groups: GlobalSearchGroup[];
  error: string;
  issue?: Issue;
};
export function useGlobalSearch(
  rawQuery: string,
  accountId?: string,
  exact = false,
) {
  const originalQuery = rawQuery.trim().slice(0, 160);
  const query = exact ? originalQuery : correctedSearch(originalQuery);
  const [version, retry] = useReducer((value: number) => value + 1, 0);
  const [state, setState] = useState<SearchState>({
    query: '',
    status: 'idle',
    groups: [],
    error: '',
  });
  useEffect(() => {
    if (!query || !accountId) {
      setState({ query, accountId, status: 'idle', groups: [], error: '' });
      return;
    }
    let active = true;
    const controller = new AbortController();
    setState(previous => ({
      query,
      accountId,
      status: 'loading',
      groups:
        previous.query === query && previous.accountId === accountId
          ? previous.groups
          : [],
      error: '',
    }));
    const timer = setTimeout(() => {
      mobileApi
        .search(query, 10, controller.signal)
        .then(response => {
          if (active)
            setState({
              query,
              accountId,
              status: 'succeeded',
              groups: response.groups
                .map(group => ({
                  ...group,
                  results: group.results.filter(result => result.title.trim()),
                }))
                .filter(group => group.results.length),
              error: '',
            });
        })
        .catch(error => {
          if (active && !controller.signal.aborted)
            setState(previous => ({
              query,
              accountId,
              status: 'failed',
              groups:
                previous.query === query && previous.accountId === accountId
                  ? previous.groups
                  : [],
              error: error instanceof Error ? error.message : 'Search failed.',
              issue: describeIssue(error),
            }));
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, accountId, version]);
  const current =
    state.query === query && state.accountId === accountId
      ? state
      : {
          query,
          accountId,
          status: query && accountId ? ('loading' as const) : ('idle' as const),
          groups: [],
          error: '',
        };
  return {
    ...current,
    correctedQuery: query !== originalQuery ? query : undefined,
    retry,
  };
}
