import Config from 'react-native-config';

export const environment = {
  apiUrl: (
    Config.READINESS_API_URL ?? 'https://api.staging.readines.com'
  ).replace(/\/$/, ''),
  googleWebClientId: Config.GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: Config.GOOGLE_IOS_CLIENT_ID,
};
