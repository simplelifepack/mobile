import { Alert } from 'react-native';
import { ApiError } from '../../../api/client';
import { documentsApi } from '../../../api/documents.api';
import type { DocumentSavePayload, DocumentSaveResponse } from '../../../api/types';

type DuplicateAction = DocumentSavePayload['duplicateAction'] | 'cancel';

export class DuplicateCancelledError extends Error {
  constructor() {
    super('Upload skipped because the document already exists.');
  }
}

export function duplicateDetails(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== 'DUPLICATE_DOCUMENT') return undefined;
  const actions = Array.isArray(error.details?.actions) ? (error.details.actions as string[]) : ['cancel'];
  const existing = error.details?.duplicateDocument as
    { id?: string; displayName?: string | null; title?: string | null } | undefined;
  return { actions, id: existing?.id, name: existing?.displayName ?? existing?.title ?? undefined };
}

export type DuplicateDetails = NonNullable<ReturnType<typeof duplicateDetails>>;

export function askDuplicateAction(details: DuplicateDetails, incomingName: string) {
  return new Promise<DuplicateAction>(resolve => {
    const existing = details.name ? `"${details.name}"` : 'a document';
    // The server only offers keep-both when the match is not an identical file.
    const canKeepBoth = details.actions.includes('keep_both');
    Alert.alert(
      'This document already exists',
      `${incomingName} matches ${existing}. Replace the existing document with this one?`,
      [
        { text: 'Replace existing', onPress: () => resolve('replace') },
        ...(canKeepBoth ? [{ text: 'Keep both', onPress: () => resolve('keep_both' as const) }] : []),
        { text: 'Skip', style: 'cancel' as const, onPress: () => resolve('cancel') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}

/** Saves a document; when the server reports a duplicate, asks whether to replace it. */
export async function saveDocumentWithDuplicatePrompt(
  payload: DocumentSavePayload,
): Promise<DocumentSaveResponse> {
  try {
    return await documentsApi.save(payload);
  } catch (error) {
    const details = duplicateDetails(error);
    if (!details) throw error;
    const action = await askDuplicateAction(details, payload.title);
    if (action === 'cancel') throw new DuplicateCancelledError();
    if (details.actions.includes('replace') || action === 'keep_both') {
      return documentsApi.save({ ...payload, duplicateAction: action });
    }
    // Identical files can't be replaced in place by the server: remove the old copy, then save.
    if (!details.id) throw error;
    await documentsApi.delete(details.id);
    return documentsApi.save({ ...payload, duplicateAction: 'keep_both' });
  }
}
