import { useSyncExternalStore } from 'react';
type Transfer = { read: number; total: number };
type Work = {
  label: string;
  direction: 'download' | 'upload';
  transfer?: Transfer;
  cancel?: () => void;
};
const active = new Map<symbol, Work>();
let completed = 0;
let started = 0;
let state = {
  active: 0,
  completed: 0,
  started: 0,
  label: 'Loading records',
  direction: 'download' as 'download' | 'upload',
  transfer: undefined as Transfer | undefined,
  cancel: undefined as (() => void) | undefined,
};
const listeners = new Set<() => void>();
function emit() {
  const work =
    [...active.values()].find(item => item.transfer) ?? [...active.values()][0];
  state = {
    active: active.size,
    completed,
    started,
    label: work?.label ?? '',
    direction: work?.direction ?? 'download',
    transfer: work?.transfer,
    cancel: work?.cancel,
  };
  listeners.forEach(listener => listener());
}
export function beginActivity(
  label = 'Loading records',
  direction: 'download' | 'upload' = 'download',
) {
  if (!active.size) {
    completed = 0;
    started = Date.now();
  }
  const id = Symbol();
  active.set(id, { label, direction });
  emit();
  return {
    setCancel(cancel: () => void) {
      const item = active.get(id);
      if (item) {
        item.cancel = cancel;
        emit();
      }
    },
    progress(read: number, total: number) {
      const item = active.get(id);
      if (item) {
        item.transfer = { read, total };
        emit();
      }
    },
    end() {
      if (active.delete(id)) {
        completed++;
        emit();
      }
    },
  };
}
export function useActivity() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => state,
  );
}
