import React from 'react';
import { EmptyState } from './EmptyState';
export function ErrorState({ message }: { message: string }) {
  return <EmptyState title="Something went wrong" message={message} />;
}
