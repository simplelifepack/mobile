import { Alert } from 'react-native';
import { preferencesApi } from '../../../api/preferences.api';
import type { SelectedDocument } from './types';

type ConsentedImportOptions = {
  select: () => Promise<SelectedDocument | undefined>;
  onConsent: (selected: SelectedDocument, aiConsent: boolean) => void;
  selectionErrorTitle?: string;
};

/** Falls back to rules-only analysis if the preference cannot be loaded. */
async function aiProcessingEnabled() {
  try {
    return (await preferencesApi.get()).aiProcessingEnabled;
  } catch {
    return false;
  }
}

/**
 * Picks a document and hands it off with the AI consent taken from the
 * account's AI processing preference (Profile > Preferences), without prompting.
 */
export async function startConsentedImport({
  select,
  onConsent,
  selectionErrorTitle = 'Unable to select document',
}: ConsentedImportOptions) {
  try {
    const selected = await select();
    if (!selected) return;
    onConsent(selected, await aiProcessingEnabled());
  } catch (error) {
    Alert.alert(
      selectionErrorTitle,
      error instanceof Error ? error.message : 'Please try again.',
    );
  }
}
