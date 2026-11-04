import { Platform } from 'react-native';
import Config from 'react-native-config';

export const environment = {
  apiUrl: (
    Config.READINESS_API_URL ??
    Platform.select({
      android: 'http://10.0.2.2:4000',
      default: 'http://localhost:4000',
    })!
  ).replace(/\/$/, ''),
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID,
  googleAndroidClientId: Config.GOOGLE_ANDROID_CLIENT_ID,
};
