import { Dirs, FileSystem } from 'react-native-file-access';
import type { DownloadedFile } from './client';

const entries = new Map<
  string,
  { file: DownloadedFile; expires: number; bytes: number }
>();
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_FILES = 12;
const TTL = 24 * 60 * 60 * 1000;
let epoch = 0;
let preparation: Promise<void> | undefined;
export function prepareDownloadDirectory() {
  if (!preparation)
    preparation = (async () => {
      const directory = `${Dirs.CacheDir}/readines-preview`;
      if (!(await FileSystem.exists(directory)))
        await FileSystem.mkdir(directory);
      // A previous process cannot own an active transfer in this process. Its
      // private download index is gone, so remove abandoned copies before reuse.
      const files = await FileSystem.ls(directory);
      await Promise.allSettled(
        files
          .filter(name => /^\d+-[a-z0-9]+[.-]/i.test(name))
          .map(name => FileSystem.unlink(`${directory}/${name}`)),
      );
    })().catch(error => {
      preparation = undefined;
      throw error;
    });
  return preparation;
}
async function remove(key: string) {
  const entry = entries.get(key);
  entries.delete(key);
  if (entry) await FileSystem.unlink(entry.file.path).catch(() => undefined);
}
export async function cachedPrivateFile(key: string, allowStale = false) {
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (
    (entry.expires <= Date.now() && !allowStale) ||
    !(await FileSystem.exists(entry.file.path))
  ) {
    await remove(key);
    return undefined;
  }
  // Do not resurrect a file invalidated while the native exists call was pending.
  if (entries.get(key) !== entry) return undefined;
  entries.delete(key);
  entries.set(key, entry);
  return entry.file;
}
export async function cachePrivateFile(key: string, file: DownloadedFile) {
  const version = epoch;
  const bytes = Number((await FileSystem.stat(file.path)).size);
  if (version !== epoch) {
    await FileSystem.unlink(file.path).catch(() => undefined);
    return;
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) return;
  if (entries.has(key)) await remove(key);
  if (version !== epoch) {
    await FileSystem.unlink(file.path).catch(() => undefined);
    return;
  }
  entries.set(key, { file, expires: Date.now() + TTL, bytes });
  let total = [...entries.values()].reduce(
    (sum, entry) => sum + entry.bytes,
    0,
  );
  for (const [oldKey, entry] of entries) {
    if (
      entries.size <= MAX_FILES &&
      total <= MAX_BYTES &&
      entry.expires > Date.now()
    )
      break;
    total -= entry.bytes;
    await remove(oldKey);
  }
}
export async function clearPrivateFileCache() {
  epoch += 1;
  const files = [...entries.values()];
  entries.clear();
  await Promise.allSettled(
    files.map(entry => FileSystem.unlink(entry.file.path)),
  );
}
