import { Alert, Linking } from 'react-native';

/** The OS owns permission lifetime; never cache a permission decision in the app. */
export function handleScannerPermissionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code !== 'CAMERA_PERMISSION' && code !== 'CAMERA_RESTRICTED')
    return false;
  if (code === 'CAMERA_RESTRICTED') {
    Alert.alert(
      'Camera access restricted',
      'Screen Time or your device administrator has disabled the camera. You can still use Upload files or From gallery.',
      [{ text: 'OK' }],
    );
  } else {
    Alert.alert(
      'Allow camera access',
      'Readines needs the camera only to scan the document you choose. Enable Camera in Settings, then return and tap Scan with camera. You can also use Upload files or From gallery.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            void Linking.openSettings().catch(() => {
              Alert.alert(
                'Open Settings manually',
                'Open your device Settings, select Readines, and enable Camera.',
              );
            });
          },
        },
      ],
    );
  }
  return true;
}
