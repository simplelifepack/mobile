import React from 'react';
import {
  EmptyArtwork,
  artworkFor,
  type EmptyArtworkKind,
} from './EmptyArtwork';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';
import { Button } from '../primitives/Button';
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  illustration,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: EmptyArtworkKind;
}) {
  return (
    <Stack gap="sm" align="center">
      <EmptyArtwork kind={illustration ?? artworkFor(title)} />
      <AppText variant="label" align="center">
        {title}
      </AppText>
      <AppText color="muted" variant="caption" align="center">
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} />
      ) : null}
    </Stack>
  );
}
