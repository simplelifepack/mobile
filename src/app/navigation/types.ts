import type { NavigatorScreenParams } from '@react-navigation/native';
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Profile: undefined;
  AppLock: undefined;
  Health: { memberId?: string; recordId?: string; tab?: string } | undefined;
  Wealth: { recordId?: string } | undefined;
  Family: { memberId?: string } | undefined;
  Legacy: undefined;
  TrustedAccess: { memberId?: string } | undefined;
  Settings: undefined;
  PackageAdmin: undefined;
  Search: { query?: string } | undefined;
  DocumentLibrary:
    | {
        documentId?: string;
        digilockerSession?: string;
        digilockerError?: string;
        scan?: boolean;
        uploadRequest?: number;
      }
    | undefined;
  Packages:
    { slug?: string; query?: string; createRequest?: number } | undefined;
  Invitation: { token: string };
  ResetPassword: { token: string };
};
export type OnboardingStackParamList = {
  Welcome: undefined;
  ReadinessIntro: undefined;
  PrivacyIntro: undefined;
};
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};
export type MainTabParamList = {
  Home: undefined;
  Documents:
    { digilockerSession?: string; digilockerError?: string } | undefined;
  Readiness: undefined;
  Health: { memberId?: string; recordId?: string; tab?: string } | undefined;
  Wealth: { recordId?: string } | undefined;
};
