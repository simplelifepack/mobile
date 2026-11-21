import { Alert } from 'react-native';
import { preferencesApi } from '../../../api/preferences.api';
type ConsentedImportOptions<T> = {
  select: () => Promise<T | undefined>;
  onConsent: (selected: T, aiConsent: boolean) => void;
  selectionErrorTitle?: string;
};

/**
 * Picks a document and hands it off with the AI consent taken from the
 * account's AI processing preference (Profile > Preferences), without prompting.
 */
export async function startConsentedImport<T>({
  select,
  onConsent,
  selectionErrorTitle = 'Unable to select document',
}: ConsentedImportOptions<T>) {
  let aiConsent: boolean;
  try {
    aiConsent = (await preferencesApi.get()).aiProcessingEnabled;
  } catch (error) {
    Alert.alert(
      'Unable to check AI preference',
      error instanceof Error ? error.message : 'Please try again before uploading.',
    );
    return;
  }
  try {
    const selected = await select();
    if (!selected) return;
    onConsent(selected, aiConsent);
  } catch (error) {
    Alert.alert(
      selectionErrorTitle,
      error instanceof Error ? error.message : 'Please try again.',
    );
  }
}
