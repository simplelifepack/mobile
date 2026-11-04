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

jest.mock('react-native-file-access', () => ({
  Dirs: { CacheDir: '/tmp/cache', DocumentDir: '/tmp/documents' },
  FileSystem: {
    exists: jest.fn().mockResolvedValue(true),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ size: 1024 }),
    ls: jest.fn().mockResolvedValue([]),
    mv: jest.fn().mockResolvedValue(undefined),
    fetchManaged: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  configure: jest.fn(),
  addEventListener: jest.fn(() => jest.fn()),
  refresh: jest.fn().mockResolvedValue({ isConnected: true }),
}));
