import { Alert } from 'react-native';

export type CombineChoice = 'combine' | 'separate' | 'cancel';

/** Asks whether several picked files are pages of one document or separate documents. */
export function askToCombine(count: number) {
  return new Promise<CombineChoice>(resolve => {
    Alert.alert(
      `Combine ${count} files?`,
      'Combine them into one multi-page document, or add each file as its own document.',
      [
        { text: 'Combine into one', onPress: () => resolve('combine') },
        { text: 'Keep separate', onPress: () => resolve('separate') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}
