export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  Subscription: undefined;
  EmergencyAccess: undefined;
  Integrations: undefined;
  DigiLocker: undefined;
  AppLock: undefined;
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
  Documents: { documentId?: string } | undefined;
  Packages: undefined;
  Health: undefined;
  Wealth: undefined;
};
