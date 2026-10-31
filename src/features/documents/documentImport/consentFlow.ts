import { Alert } from 'react-native';
import { discardSelectedDocument } from './analysis';
import type { SelectedDocument } from './types';

type ConsentedImportOptions = {
  select: () => Promise<SelectedDocument | undefined>;
  onConsent: (selected: SelectedDocument, aiConsent: boolean) => void;
  promptTitle?: string;
  promptMessage?: string;
  selectionErrorTitle?: string;
};

const DEFAULT_PROMPT_MESSAGE =
  'The file is encrypted on this device before upload. Choose whether to allow AI analysis.';

/**
 * Picks a document, asks the user whether AI analysis is allowed, then hands off.
 * The local copy is discarded if the user cancels.
 */
export async function startConsentedImport({
  select,
  onConsent,
  promptTitle = 'Analyze document?',
  promptMessage = DEFAULT_PROMPT_MESSAGE,
  selectionErrorTitle = 'Unable to select document',
}: ConsentedImportOptions) {
  try {
    const selected = await select();
    if (!selected) return;
    Alert.alert(
      promptTitle,
      promptMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => discardSelectedDocument(selected),
        },
        { text: 'Rules only', onPress: () => onConsent(selected, false) },
        { text: 'Allow AI', onPress: () => onConsent(selected, true) },
      ],
      { cancelable: false },
    );
  } catch (error) {
    Alert.alert(
      selectionErrorTitle,
      error instanceof Error ? error.message : 'Please try again.',
    );
  }
}
