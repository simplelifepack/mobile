const mockOpen = jest.fn();
jest.mock('react-native-nitro-sqlite', () => ({
  open: (...args: unknown[]) => mockOpen(...args),
}));
beforeEach(() => {
  jest.resetModules();
  mockOpen.mockReset();
});
it('shares one initialization and never exposes a connection before migrations finish', async () => {
  let release!: () => void;
  const connection = {
    executeAsync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  };
  connection.executeAsync.mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        release = resolve;
      }),
  );
  mockOpen.mockReturnValue(connection);
  const database = require('./index');
  const first = database.initializeDatabase(),
    second = database.initializeDatabase();
  expect(mockOpen).toHaveBeenCalledTimes(1);
  expect(() => database.getDatabase()).toThrow();
  release();
  expect(await first).toBe(connection);
  expect(await second).toBe(connection);
  expect(database.getDatabase()).toBe(connection);
});
it('closes failed initialization and permits a clean retry', async () => {
  const failed = {
    executeAsync: jest.fn().mockRejectedValue(new Error('disk error')),
    close: jest.fn(),
  };
  const ready = {
    executeAsync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  };
  mockOpen.mockReturnValueOnce(failed).mockReturnValueOnce(ready);
  const database = require('./index');
  await expect(database.initializeDatabase()).rejects.toThrow('disk error');
  expect(failed.close).toHaveBeenCalledTimes(1);
  expect(await database.initializeDatabase()).toBe(ready);
});
