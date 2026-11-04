import { useSyncExternalStore } from 'react';
let email: string | null = null;
const listeners = new Set<() => void>();
export function setSessionGate(value: string | null) {
  if (email !== value) {
    email = value;
    listeners.forEach(listener => listener());
  }
}
export const sessionGateEmail = () => email;
export function useSessionGate() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sessionGateEmail,
    sessionGateEmail,
  );
}
