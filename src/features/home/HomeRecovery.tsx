import React from 'react';
import { describeIssue, type Issue } from '../../components/feedback/issue';
import { useConnectivity } from '../../network/connectivity';
import { AppText, Button, Stack } from '../shared/FeatureUI';

export type HomeSection = {
  label: string;
  error: unknown;
  issue?: Issue;
  loading: boolean;
  retry: () => unknown;
};

/** A single recovery action for the independently loaded Home sections. */
export function HomeRecovery({ sections }: { sections: HomeSection[] }) {
  const network = useConnectivity();
  const failed = sections.filter(section => Boolean(section.error));
  if (!failed.length || network.offline) return null;
  return (
    <Stack gap="sm">
      <AppText color="secondary" accessibilityRole="alert">
        Couldn’t refresh {failed.map(section => section.label).join(', ')}.
        Previously loaded data is kept where available.
      </AppText>
      <AppText variant="caption" color="secondary">
        {[
          ...new Set(
            failed.map(
              section =>
                (section.issue ?? describeIssue(section.error)).message,
            ),
          ),
        ].join(' ')}
      </AppText>
      <Button
        title="Retry account data"
        disabled={failed.some(section => section.loading)}
        onPress={() => failed.forEach(section => section.retry())}
      />
    </Stack>
  );
}
