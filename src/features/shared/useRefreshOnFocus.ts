import React from 'react';
import { networkSnapshot } from '../../network/connectivity';
import { useFocusEffect } from '@react-navigation/native';

/** First load belongs to the resource; returning to a screen reuses fresh cached reads. */
export function useRefreshOnFocus(...refreshers: Array<() => void>) {
  const first = React.useRef(true);
  const current = React.useRef(refreshers);
  current.current = refreshers;
  useFocusEffect(
    React.useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (networkSnapshot().offline) return;
      current.current.forEach(refresh => refresh());
    }, []),
  );
}
