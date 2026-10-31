export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Profile: undefined;
  Family: undefined;
  Trust: undefined;
  Integrations: undefined;
  DigiLocker: undefined;
  Invitation: { token: string };
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
  Documents: undefined;
  Packages: undefined;
  Health: undefined;
  Wealth: undefined;
};
