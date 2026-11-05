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

jest.mock('react-native-file-access', () => ({
  Dirs: {
    CacheDir: '/tmp/readiness-cache',
    DocumentDir: '/tmp/readiness-documents',
  },
  FileSystem: {
    cp: jest.fn().mockResolvedValue(undefined),
    cpExternal: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
    fetch: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(''),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-pdf', () => 'Pdf');

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  keepLocalCopy: jest.fn(),
  types: { pdf: 'application/pdf', images: 'image/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: error => Boolean(error?.code),
}));

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-quick-crypto', () => ({
  __esModule: true,
  default: { Buffer: require('buffer').Buffer },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
  isErrorWithCode: error => Boolean(error?.code),
  isSuccessResponse: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: { ios: { openDocument: jest.fn() }, android: { actionViewIntent: jest.fn() } },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(),
    getTriggerNotificationIds: jest.fn(async () => []),
    cancelTriggerNotification: jest.fn(),
    createTriggerNotification: jest.fn(),
  },
  AuthorizationStatus: { AUTHORIZED: 1 },
  TriggerType: { TIMESTAMP: 0 },
}));
