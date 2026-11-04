import React from 'react';
import { DataLoadingBoundary } from '../../components/feedback/DataLoadingBoundary';

export function HomeDataState(
  props: React.ComponentProps<typeof DataLoadingBoundary>,
) {
  return (
    <DataLoadingBoundary
      {...props}
      loading={false}
      refreshing={Boolean(props.loading || props.refreshing)}
      refreshingLabel="Refreshing your overview…"
    />
  );
}
