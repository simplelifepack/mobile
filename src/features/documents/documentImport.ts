import { pick, types, keepLocalCopy, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { FileSystem } from 'react-native-file-access';
import { documentsApi } from '../../api/documents.api';
import type { DocumentAnalysisResponse } from '../../api/types';
import {
  encryptDocumentForUpload,
  MAX_DOCUMENT_SIZE_BYTES,
  type SupportedDocumentMimeType,
} from '../../security/documentEncryption';

export type SelectedDocument = {
  path: string;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
};

function localPath(uri: string) {
  const filePrefix = 'file://';
  return decodeURIComponent(
    uri.startsWith(filePrefix) ? uri.slice(filePrefix.length) : uri,
  );
}

function safeFileName(name: string | null | undefined) {
  return (name || 'document')
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

function supportedMimeType(
  mimeType: string | null | undefined,
  fileName: string,
): SupportedDocumentMimeType {
  const normalizedMime = mimeType?.toLowerCase().split(';')[0];
  if (
    normalizedMime === 'application/pdf' ||
    normalizedMime === 'image/jpeg' ||
    normalizedMime === 'image/png' ||
    normalizedMime === 'image/webp'
  ) {
    return normalizedMime;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  throw new Error('Choose a PDF, JPEG, PNG, or WebP document.');
}

export async function selectDocumentFile(): Promise<SelectedDocument | undefined> {
  try {
    const [picked] = await pick({
      type: [types.pdf, types.images],
      mode: 'import',
      allowMultiSelection: false,
    });
    const fileName = safeFileName(picked.name);
    const mimeType = supportedMimeType(picked.type, fileName);
    const [copy] = await keepLocalCopy({
      files: [{ uri: picked.uri, fileName }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') {
      throw new Error(copy.copyError || 'Unable to access the selected file.');
    }
    return {
      path: localPath(copy.localUri),
      fileName,
      mimeType,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return undefined;
    }
    throw error;
  }
}

async function selectPhoto(useCamera: boolean): Promise<SelectedDocument | undefined> {
  const result = useCamera
    ? await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        assetRepresentationMode: 'compatible',
        quality: 1,
      })
    : await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        assetRepresentationMode: 'compatible',
        quality: 1,
      });

  if (result.didCancel) return undefined;
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Unable to open the image picker.');
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) return undefined;
  const fileName = safeFileName(asset.fileName);
  return {
    path: localPath(asset.uri),
    fileName,
    mimeType: supportedMimeType(asset.type ?? 'image/jpeg', fileName),
  };
}

export const selectImageFromGallery = () => selectPhoto(false);
export const captureDocumentPhoto = () => selectPhoto(true);

export async function discardSelectedDocument(selected: SelectedDocument) {
  if (await FileSystem.exists(selected.path)) {
    await FileSystem.unlink(selected.path).catch(() => undefined);
  }
}

export async function analyzeSelectedDocument(
  selected: SelectedDocument,
  aiAnalysisConsent: boolean,
): Promise<DocumentAnalysisResponse> {
  let encryptedPath: string | undefined;
  try {
    const stat = await FileSystem.stat(selected.path);
    if (stat.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error('Choose a file smaller than 10 MB.');
    }
    const key = await documentsApi.getEncryptionKey();
    const encrypted = await encryptDocumentForUpload(
      selected.path,
      selected.fileName,
      selected.mimeType,
      key,
      aiAnalysisConsent,
    );
    encryptedPath = encrypted.path;
    return await documentsApi.analyzeEncrypted(
      [
        {
          uri: encryptedPath.startsWith('file://')
            ? encryptedPath
            : `file://${encryptedPath}`,
          name: `${selected.fileName}.enc`,
        },
      ],
      [encrypted.envelope],
    );
  } finally {
    if (encryptedPath && (await FileSystem.exists(encryptedPath))) {
      await FileSystem.unlink(encryptedPath).catch(() => undefined);
    }
    if (await FileSystem.exists(selected.path)) {
      await FileSystem.unlink(selected.path).catch(() => undefined);
    }
  }
}
