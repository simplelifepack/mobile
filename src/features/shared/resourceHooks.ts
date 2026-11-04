import React from 'react';
import { describeIssue, type Issue } from '../../components/feedback/issue';
import { invalidateReadCaches } from '../../api/client';

export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: React.DependencyList = [],
) {
  const key = JSON.stringify(dependencies);
  const [state, setState] = React.useState<{
    key: string;
    data?: T;
    error: string;
    issue?: Issue;
    loading: boolean;
  }>({ key, error: '', loading: true });
  const [version, revalidate] = React.useReducer(
    (value: number) => value + 1,
    0,
  );
  const refresh = React.useCallback(() => {
    invalidateReadCaches();
    revalidate();
  }, []);
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState(previous => ({
      key,
      data: previous.key === key ? previous.data : undefined,
      error: '',
      issue: undefined,
      loading: true,
    }));
    Promise.resolve()
      .then(() => loader(controller.signal))
      .then(data => {
        if (active) setState({ key, data, error: '', loading: false });
      })
      .catch(error => {
        if (active)
          setState(previous => ({
            ...previous,
            issue: describeIssue(error),
            error:
              error instanceof Error ? error.message : 'Unable to load data.',
            loading: false,
          }));
      });
    return () => {
      active = false;
      controller.abort();
    };
    // Loaders are intentionally keyed by explicit data dependencies, not render identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  return {
    data: state.key === key ? state.data : undefined,
    error: state.key === key ? state.error : '',
    issue: state.key === key ? state.issue : undefined,
    loading: state.key !== key || state.loading,
    refresh,
    revalidate,
  };
}

export function useAction(refresh?: () => void) {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const running = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = async (action: () => Promise<unknown>, success = 'Done.') => {
    if (running.current || !mounted.current) return false;
    running.current = true;
    setBusy(true);
    setMessage('');
    try {
      await action();
      if (mounted.current) {
        setMessage(
          success
            ? `${success} You can continue here or return to the list.`
            : '',
        );
        if (success) refresh?.();
      }
      return true;
    } catch (error) {
      if (mounted.current) {
        const issue = describeIssue(error);
        setMessage(`${issue.title}. ${issue.message} ${issue.next}`);
      }
      return false;
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return { busy, message, run };
}
