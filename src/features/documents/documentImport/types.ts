import type { SupportedDocumentMimeType } from '../../../security/documentEncryption';

export type SelectedDocument = {
  path: string;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
  /** Set when several files are combined into one multi-page document. */
  pages?: SelectedDocument[];
};
