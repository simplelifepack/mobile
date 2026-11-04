import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { environment } from '../../../config/environment';

let configuredFor = '';
export async function googleIdToken(): Promise<string> {
  const webClientId = environment.googleWebClientId.trim();
  const iosClientId = environment.googleIosClientId?.trim();
  if (!webClientId)
    throw new Error('Google Sign-In is not configured for this build.');
  if (Platform.OS === 'ios' && !iosClientId)
    throw new Error('Google Sign-In for iOS is not configured for this build.');
  const configuration = JSON.stringify([webClientId, iosClientId]);
  if (configuredFor !== configuration) {
    GoogleSignin.configure({ webClientId, iosClientId });
    configuredFor = configuration;
  }
  if (Platform.OS === 'android')
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response))
    throw new Error('Google Sign-In was cancelled.');
  if (!response.data.idToken)
    throw new Error('Google did not return an ID token.');
  return response.data.idToken;
}
