/* global jest */
jest.mock('react-native-nitro-sqlite', () => ({
  open: () => ({
    executeAsync: jest
      .fn()
      .mockResolvedValue({ rows: { _array: [], length: 0 } }),
  }),
}));
jest.mock('react-native-config', () => ({
  READINESS_API_URL: 'http://localhost:4000',
  GOOGLE_WEB_CLIENT_ID: 'test-client-id',
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
  isSuccessResponse: jest.fn(),
}));
