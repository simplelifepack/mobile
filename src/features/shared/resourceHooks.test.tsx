import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { useAction, useResource } from './resourceHooks';
jest.mock('../../api/client', () => ({ invalidateReadCaches: jest.fn() }));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};
it('ignores old resources after a key changes and aborts them on cleanup', async () => {
  const first = deferred<string>(),
    second = deferred<string>();
  let value!: ReturnType<typeof useResource<string>>;
  const signals: AbortSignal[] = [];
  function Probe({ id }: { id: string }) {
    value = useResource(
      signal => {
        signals.push(signal);
        return id === 'a' ? first.promise : second.promise;
      },
      [id],
    );
    return null;
  }
  let root!: Renderer.ReactTestRenderer;
  await act(async () => {
    root = Renderer.create(<Probe id="a" />);
  });
  await act(async () => {
    root.update(<Probe id="b" />);
  });
  expect(signals[0].aborted).toBe(true);
  await act(async () => {
    first.resolve('old');
  });
  expect(value.data).toBeUndefined();
  await act(async () => {
    second.resolve('current');
  });
  expect(value.data).toBe('current');
  await act(async () => {
    root.unmount();
  });
  expect(signals[1].aborted).toBe(true);
});
it('catches synchronous loaders and keeps refresh stable across renders', async () => {
  let value!: ReturnType<typeof useResource<string>>;
  function Probe() {
    value = useResource(() => {
      throw new Error('failed');
    });
    return null;
  }
  let root!: Renderer.ReactTestRenderer;
  await act(async () => {
    root = Renderer.create(<Probe />);
  });
  expect(value.error).toBe('failed');
  const refresh = value.refresh;
  await act(async () => {
    root.update(<Probe />);
  });
  expect(value.refresh).toBe(refresh);
  await act(async () => {
    root.unmount();
  });
});
it('blocks double submissions and does not refresh a screen that has unmounted', async () => {
  const work = deferred<void>();
  const refresh = jest.fn();
  const mutation = jest.fn(() => work.promise);
  let value!: ReturnType<typeof useAction>;
  function Probe() {
    value = useAction(refresh);
    return null;
  }
  let root!: Renderer.ReactTestRenderer;
  await act(async () => {
    root = Renderer.create(<Probe />);
  });
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = value.run(mutation);
    await value.run(mutation);
  });
  expect(mutation).toHaveBeenCalledTimes(1);
  await act(async () => {
    root.unmount();
  });
  await act(async () => {
    work.resolve();
    await pending;
  });
  expect(refresh).not.toHaveBeenCalled();
});
