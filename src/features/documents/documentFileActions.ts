import { NativeModules, Platform, Share } from 'react-native';
import { Dirs, FileSystem } from 'react-native-file-access';

type DocumentFilesModule = {
  shareFile: (path: string, name: string, mimeType: string) => Promise<void>;
  renderPdfPage: (path: string, pageIndex: number) => Promise<string>;
};

const nativeFiles = (): DocumentFilesModule | undefined => NativeModules.DocumentFiles;

const extensions: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export const canSaveAsImage = (mimeType: string) =>
  mimeType.startsWith('image/') || (mimeType === 'application/pdf' && Platform.OS === 'android');

/** A readable file name that always carries the extension matching the file's type. */
export function documentFileName(title: string, mimeType: string) {
  const extension = extensions[mimeType];
  const clean = title.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim() || 'Document';
  return extension ? `${clean.replace(/\.[a-z0-9]{2,4}$/i, '')}${extension}` : clean;
}

async function shareNamedCopy(path: string, name: string) {
  const copy = `${Dirs.CacheDir}/${name}`;
  await FileSystem.cp(path, copy);
  try {
    await Share.share({ url: `file://${copy}` });
  } finally {
    await FileSystem.unlink(copy).catch(error => console.warn('Unable to remove shared document copy', error));
  }
}

/** Opens the system share sheet so the document can go to any installed app. */
export async function shareDocumentFile(path: string, name: string, mimeType: string) {
  if (Platform.OS === 'ios') return shareNamedCopy(path, name);
  const files = nativeFiles();
  if (!files) throw new Error('Sharing is unavailable on this device.');
  await files.shareFile(path, name, mimeType);
}

/** Android saves into Downloads; iOS offers "Save to Files" from the share sheet. */
export async function downloadDocumentFile(path: string, name: string) {
  if (Platform.OS === 'ios') {
    await shareNamedCopy(path, name);
    return undefined;
  }
  await FileSystem.cpExternal(path, name, 'downloads');
  return `Saved to Downloads/${name}.`;
}

/**
 * Android saves the image, or the visible PDF page rendered as a PNG, to Pictures.
 * iOS offers "Save Image" from the share sheet for image documents.
 */
export async function saveDocumentAsImage(path: string, name: string, mimeType: string, pageIndex = 0) {
  if (!canSaveAsImage(mimeType)) throw new Error('Saving as an image is not available for this file.');
  if (Platform.OS === 'ios') {
    await shareNamedCopy(path, name);
    return undefined;
  }
  const baseName = name.replace(/\.[a-z0-9]{2,4}$/i, '');
  if (mimeType.startsWith('image/')) {
    await FileSystem.cpExternal(path, name, 'images');
    return `Saved to Pictures/${name}.`;
  }
  const files = nativeFiles();
  if (!files) throw new Error('Saving as an image is unavailable on this device.');
  const rendered = await files.renderPdfPage(path, pageIndex);
  const imageName = `${baseName}-page-${pageIndex + 1}.png`;
  try {
    await FileSystem.cpExternal(rendered, imageName, 'images');
  } finally {
    await FileSystem.unlink(rendered).catch(error => console.warn('Unable to remove rendered page', error));
  }
  return `Saved to Pictures/${imageName}.`;
}
