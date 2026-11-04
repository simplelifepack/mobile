import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { environment } from '../config/environment';
let state = { offline: false, unreachable: false };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const networkSnapshot = () => state;
function update(next: Partial<typeof state>) {
  if (
    Object.entries(next).every(
      ([key, value]) => state[key as keyof typeof state] === value,
    )
  )
    return;
  state = { ...state, ...next };
  listeners.forEach(listener => listener());
}
export const useConnectivity = () =>
  useSyncExternalStore(subscribe, networkSnapshot, networkSnapshot);
export function startConnectivity() {
  NetInfo.configure({
    reachabilityUrl: `${environment.apiUrl}/health`,
    reachabilityMethod: 'GET',
    reachabilityTest: async response => response.status === 200,
  });
  return NetInfo.addEventListener(value =>
    update({
      offline: value.isConnected === false,
      unreachable:
        value.isConnected === true && value.isInternetReachable === false,
    }),
  );
}
export const markServiceReachable = () => update({ unreachable: false });
export const checkConnectivity = () => NetInfo.refresh();
