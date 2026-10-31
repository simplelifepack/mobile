import type { SupportedDocumentMimeType } from '../../../security/documentEncryption';

export type SelectedDocument = {
  path: string;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
};
