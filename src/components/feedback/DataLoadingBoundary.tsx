import React from 'react';
import styled from 'styled-components/native';
import { AppText } from '../primitives/AppText';
import { LoadingState } from './LoadingState';
const Content = styled.View<{ $page: boolean }>(({ theme, $page }) => ({
  gap: $page ? theme.spacing.lg : theme.spacing.sm + theme.spacing.xs,
}));
const RefreshStatus = styled.View(() => ({
  position: 'absolute',
  top: -20,
  left: 0,
  right: 0,
  minHeight: 20,
}));
export function DataLoadingBoundary({
  loading,
  refreshing,
  children,
  loadingLabel = 'Loading…',
  refreshingLabel = 'Refreshing…',
  page = false,
}: React.PropsWithChildren<{
  loading: boolean;
  refreshing?: boolean;
  loadingLabel?: string;
  refreshingLabel?: string;
  page?: boolean;
}>) {
  if (loading) return <LoadingState label={loadingLabel} />;
  return (
    <Content $page={page}>
      {refreshing !== undefined ? (
        <RefreshStatus>
          <AppText
            variant="caption"
            color="secondary"
            accessibilityLiveRegion="polite"
          >
            {refreshing ? refreshingLabel : ''}
          </AppText>
        </RefreshStatus>
      ) : null}
      {children}
    </Content>
  );
}
