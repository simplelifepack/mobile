import React from 'react';
import { EmptyState } from './EmptyState';
import { nextSearch } from '../../features/search/searchRecovery';
export function NoSearchResults({
  query,
  onSearch,
  subject = 'records',
}: {
  query: string;
  onSearch: (query: string) => void;
  subject?: string;
}) {
  const suggestion = nextSearch(
    query,
    /measurement|report/.test(subject)
      ? 'cholesterol'
      : /Wealth/.test(subject)
        ? 'account'
        : 'passport',
  );
  return (
    <EmptyState
      title="No matches found"
      message={`No ${subject} match “${query}”. Try a shorter phrase or a document type.`}
      actionLabel={
        suggestion ? `Search “${suggestion}”` : `Browse all ${subject}`
      }
      onAction={() => onSearch(suggestion)}
    />
  );
}
