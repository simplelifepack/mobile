import { validateDocumentUpload } from '../config/documents';
import { NativeModules, Share, Platform } from 'react-native';
import { Dirs, FileSystem } from 'react-native-file-access';
import { request, type DownloadedFile } from '../api/client';
export type PickedDocument = {
  uri: string;
  name: string;
  type: string;
  size: number;
};
type FilesBridge = {
  pick(): Promise<PickedDocument[]>;
  pickGallery(): Promise<PickedDocument[]>;
  encrypt(
    file: PickedDocument,
    pem: string,
  ): Promise<{
    uri: string;
    iv: string;
    wrappedKey: string;
    originalSha256: string;
    encryptedSha256: string;
  }>;
  open(path: string, mime: string): Promise<void>;
  preview?(path: string, mime: string, title: string): Promise<void>;
  createPdf(text: string, title: string): Promise<string>;
};
const bridge = () => {
  const result = NativeModules.ReadinessFiles as FilesBridge | undefined;
  if (!result)
    throw new Error('Document file support requires a rebuilt native app.');
  return result;
};
export const pickDocuments = () => bridge().pick();
export const pickGallery = () => {
  const files = bridge();
  if (!files.pickGallery)
    throw new Error('Rebuild the app to enable photo gallery import.');
  return files.pickGallery();
};
async function buildEncryptedDocumentFormData(
  files: PickedDocument[],
  consent: boolean,
  temporaryPaths: string[],
) {
  validateDocumentUpload(files);
  const key = await request<{
    algorithm: string;
    publicKeyPem: string;
    keyId: string;
    keyVersion: number;
  }>('/documents/encryption-key', { requiresAuth: true });
  if (key.algorithm !== 'RSA-OAEP-4096-SHA256')
    throw new Error('Unsupported encryption key.');
  const form = new FormData();
  const envelopes = [];
  for (const file of files) {
    const encrypted = await bridge().encrypt(file, key.publicKeyPem);
    temporaryPaths.push(encrypted.uri);
    form.append('encryptedFiles', {
      uri: encrypted.uri,
      name: 'document.readines',
      type: 'application/octet-stream',
    } as unknown as Blob);
    envelopes.push({
      wrappedKey: encrypted.wrappedKey,
      iv: encrypted.iv,
      encryptionVersion: 1,
      keyId: key.keyId,
      keyVersion: key.keyVersion,
      contentAlgorithm: 'AES-256-GCM',
      keyAlgorithm: key.algorithm,
      originalFilename: file.name,
      originalMimeType: file.type,
      originalSize: file.size,
      originalSha256: encrypted.originalSha256,
      encryptedSha256: encrypted.encryptedSha256,
    });
  }
  form.append('envelopes', JSON.stringify(envelopes));
  form.append('aiAnalysisConsent', String(consent));
  return form;
}
export async function sendEncryptedDocuments<T>(
  path: string,
  files: PickedDocument[],
  consent = false,
) {
  const temporaryPaths: string[] = [];
  try {
    const form = await buildEncryptedDocumentFormData(
      files,
      consent,
      temporaryPaths,
    );
    return await request<T>(path, {
      method: 'POST',
      body: form,
      requiresAuth: true,
    });
  } finally {
    await cleanupPickedDocuments(temporaryPaths.map(uri => ({ uri })));
  }
}
export async function cleanupPickedDocuments(files: Array<{ uri: string }>) {
  const appRoot = Dirs.DocumentDir.replace(/\/Documents$/, '');
  await Promise.allSettled(
    files.map(async ({ uri }) => {
      const localPath = uri.replace('file://', '');
      if (
        !localPath.startsWith(`${Dirs.CacheDir}/`) &&
        !localPath.startsWith(`${appRoot}/tmp/readines-upload/`)
      )
        return;
      if (await FileSystem.exists(localPath))
        await FileSystem.unlink(localPath);
    }),
  );
}
export async function openDownload(result: DownloadedFile) {
  if (Platform.OS === 'ios')
    await Share.share({ url: `file://${result.path}` });
  else await bridge().open(result.path, result.mimeType);
}

/** Open a cached document in the native viewer; exporting stays a separate action. */
export async function previewDownload(result: DownloadedFile) {
  const files = bridge();
  if (!files.preview)
    throw new Error('Update Readines to preview this document inside the app.');
  return files.preview(result.path, result.mimeType, result.fileName);
}

export async function exportTextPdf(title: string, text: string) {
  const path = await bridge().createPdf(text, title);
  if (Platform.OS === 'ios') await Share.share({ url: `file://${path}` });
  else await bridge().open(path, 'application/pdf');
}
