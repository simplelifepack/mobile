import type { SupportedDocumentMimeType } from '../../../security/documentEncryption';

const FILE_URI_PREFIX = 'file://';
const MAX_FILE_NAME_LENGTH = 255;

const MIME_BY_EXTENSION: Record<string, SupportedDocumentMimeType> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const SUPPORTED_MIME_TYPES = new Set<string>(Object.values(MIME_BY_EXTENSION));

export function toLocalPath(uri: string): string {
  return decodeURIComponent(
    uri.startsWith(FILE_URI_PREFIX) ? uri.slice(FILE_URI_PREFIX.length) : uri,
  );
}

export function toFileUri(path: string): string {
  return path.startsWith(FILE_URI_PREFIX) ? path : `${FILE_URI_PREFIX}${path}`;
}

/** Strips directory components and control characters from a user-supplied name. */
export function sanitizeFileName(name: string | null | undefined): string {
  const baseName = (name || 'document').split(/[\\/]/).pop() ?? '';
  return Array.from(baseName, character => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? '_' : character;
  })
    .join('')
    .slice(0, MAX_FILE_NAME_LENGTH);
}

export function resolveMimeType(
  mimeType: string | null | undefined,
  fileName: string,
): SupportedDocumentMimeType {
  const declared = mimeType?.toLowerCase().split(';')[0];
  if (declared && SUPPORTED_MIME_TYPES.has(declared)) {
    return declared as SupportedDocumentMimeType;
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const inferred = MIME_BY_EXTENSION[extension];
  if (!inferred) {
    throw new Error('Choose a PDF, JPEG, PNG, or WebP document.');
  }
  return inferred;
}
