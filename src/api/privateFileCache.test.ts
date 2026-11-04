import { FileSystem } from 'react-native-file-access';
import {
  cachePrivateFile,
  cachedPrivateFile,
  clearPrivateFileCache,
} from './privateFileCache';
beforeEach(async () => {
  await clearPrivateFileCache();
  jest.clearAllMocks();
  (FileSystem.exists as jest.Mock).mockResolvedValue(true);
  (FileSystem.stat as jest.Mock).mockResolvedValue({ size: 1024 });
});
afterEach(() => jest.restoreAllMocks());
const file = (name: string) => ({
  path: `/tmp/cache/${name}.pdf`,
  fileName: `${name}.pdf`,
  mimeType: 'application/pdf',
});
it('evicts the oldest retained file rather than growing without limit', async () => {
  for (let i = 0; i < 13; i++)
    await cachePrivateFile(String(i), file(String(i)));
  expect(await cachedPrivateFile('0')).toBeUndefined();
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/cache/0.pdf');
  expect(await cachedPrivateFile('12')).toEqual(file('12'));
});
it('expires files, handles OS cache eviction, and clears private paths', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  await cachePrivateFile('a', file('a'));
  now.mockReturnValue(86401001);
  expect(await cachedPrivateFile('a')).toBeUndefined();
  await cachePrivateFile('b', file('b'));
  (FileSystem.exists as jest.Mock).mockResolvedValueOnce(false);
  expect(await cachedPrivateFile('b')).toBeUndefined();
  await cachePrivateFile('c', file('c'));
  await clearPrivateFileCache();
  expect(await cachedPrivateFile('c')).toBeUndefined();
});
it('does not reinsert a private file if the account changed during native stat', async () => {
  let finish!: (value: unknown) => void;
  (FileSystem.stat as jest.Mock).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const pending = cachePrivateFile('old', file('old'));
  await clearPrivateFileCache();
  finish({ size: 1024 });
  await pending;
  expect(await cachedPrivateFile('old')).toBeUndefined();
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/cache/old.pdf');
});

it('reuses a private preview beyond five minutes without fetching it again', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  await cachePrivateFile('preview', file('preview'));
  now.mockReturnValue(60 * 60 * 1000);
  expect(await cachedPrivateFile('preview')).toEqual(file('preview'));
});
