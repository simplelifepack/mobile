import React from 'react';
import { AppText } from '../primitives/AppText';
import { Button } from '../primitives/Button';
import { Stack } from '../primitives/Stack';
import { describeIssue, type Issue } from './issue';
export function ErrorState({
  message,
  error,
  issue,
  onRetry,
  onBack,
}: {
  message?: string;
  error?: unknown;
  issue?: Issue;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  const problem = issue ?? describeIssue(error ?? message);
  return (
    <Stack gap="sm">
      <AppText variant="label" accessibilityRole="alert">
        {problem.title}
      </AppText>
      <AppText color="secondary">{problem.message}</AppText>
      <AppText color="muted" variant="caption">
        {problem.next}
      </AppText>
      {onRetry ? <Button title="Try again" onPress={onRetry} /> : null}
      {onBack ? (
        <Button title="Go back" variant="secondary" onPress={onBack} />
      ) : null}
    </Stack>
  );
}
