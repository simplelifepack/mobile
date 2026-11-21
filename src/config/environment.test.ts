afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native-config');
});

it('defaults to the staging API when no URL is configured', () => {
  jest.doMock('react-native-config', () => ({}));
  const { environment } = require('./environment') as typeof import('./environment');

  expect(environment.apiUrl).toBe('https://api.staging.readines.com');
});

it('allows an explicit API URL override and removes a trailing slash', () => {
  jest.doMock('react-native-config', () => ({
    READINESS_API_URL: 'http://localhost:4000/',
  }));
  const { environment } = require('./environment') as typeof import('./environment');

  expect(environment.apiUrl).toBe('http://localhost:4000');
});
