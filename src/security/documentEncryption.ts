import { Dirs, FileSystem } from 'react-native-file-access';
import QuickCrypto from 'react-native-quick-crypto';
import type {
  EncryptedDocumentEnvelope,
  PublicDocumentEncryptionKey,
} from '../api/types';

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export type SupportedDocumentMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp';

export type EncryptedDocumentFile = {
  path: string;
  envelope: EncryptedDocumentEnvelope;
};

function base64Url(value: { toString(encoding: 'base64'): string }) {
  let encoded = value
    .toString('base64')
    .split('+')
    .join('-')
    .split('/')
    .join('_');
  while (encoded.endsWith('=')) encoded = encoded.slice(0, -1);
  return encoded;
}

function safeFilename(filename: string) {
  return filename
    .split(/[\\/]/)
    .pop()!
    .split('')
    .map(character => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? '_' : character;
    })
    .join('')
    .slice(0, 255);
}

export async function encryptDocumentForUpload(
  sourcePath: string,
  filename: string,
  mimeType: SupportedDocumentMimeType,
  publicKey: PublicDocumentEncryptionKey,
  aiAnalysisConsent = false,
): Promise<EncryptedDocumentFile> {
  const base64 = await FileSystem.readFile(sourcePath, 'base64');
  const originalBytes = QuickCrypto.Buffer.from(base64, 'base64');
  if (originalBytes.length === 0) throw new Error('The selected file is empty.');
  if (originalBytes.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error('Choose a file smaller than 10 MB.');
  }

  const aesKey = QuickCrypto.randomBytes(32);
  const iv = QuickCrypto.randomBytes(12);
  let encryptedPath: string | undefined;

  try {
    const cipher = QuickCrypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const encryptedBytes = QuickCrypto.Buffer.concat([
      cipher.update(originalBytes),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
    const wrappedKey = QuickCrypto.publicEncrypt(
      {
        key: publicKey.publicKeyPem,
        padding: QuickCrypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey,
    );
    const sanitizedFilename = safeFilename(filename || 'document');
    encryptedPath = `${Dirs.CacheDir}/readiness-upload-${QuickCrypto.randomUUID()}.bin`;
    await FileSystem.writeFile(
      encryptedPath,
      encryptedBytes.toString('base64'),
      'base64',
    );

    const envelope: EncryptedDocumentEnvelope = {
      wrappedKey: base64Url(wrappedKey),
      iv: base64Url(iv),
      encryptionVersion: 1,
      keyId: publicKey.keyId,
      keyVersion: publicKey.keyVersion,
      contentAlgorithm: 'AES-256-GCM',
      keyAlgorithm: 'RSA-OAEP-4096-SHA256',
      originalFilename: sanitizedFilename,
      originalMimeType: mimeType,
      originalSize: originalBytes.length,
      originalSha256: QuickCrypto.createHash('sha256')
        .update(originalBytes)
        .digest('hex'),
      encryptedSha256: QuickCrypto.createHash('sha256')
        .update(encryptedBytes)
        .digest('hex'),
      aiAnalysisConsent,
    };

    return { path: encryptedPath, envelope };
  } catch (error) {
    if (encryptedPath && (await FileSystem.exists(encryptedPath))) {
      await FileSystem.unlink(encryptedPath).catch(() => undefined);
    }
    throw error;
  } finally {
    aesKey.fill(0);
    originalBytes.fill(0);
  }
}
