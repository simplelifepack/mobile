export type ScanOptions = {
  pageLimit?: number;
  allowGalleryImport?: boolean;
  resultFormats?: Array<'jpeg' | 'pdf'>;
};
export type ScannedPage = {
  pageNumber: number;
  localPath: string;
  mimeType: 'image/jpeg';
};
export type ScanResult = { pages: ScannedPage[]; pdfPath?: string };
export interface DocumentScannerContract {
  isSupported(): Promise<boolean>;
  scan(options?: ScanOptions): Promise<ScanResult>;
}
