import { NativeModules } from 'react-native';
import type { DocumentScannerContract, ScanOptions, ScanResult } from './types';
type NativeScanner = {
  isSupported(): Promise<boolean>;
  scan(options: ScanOptions): Promise<ScanResult>;
};
const nativeScanner = NativeModules.ReadinessDocumentScanner as
  NativeScanner | undefined;
export const DocumentScanner: DocumentScannerContract = {
  async isSupported() {
    return nativeScanner ? nativeScanner.isSupported() : false;
  },
  async scan(options = {}) {
    if (!nativeScanner)
      throw new Error('Native document scanner is not linked.');
    return nativeScanner.scan(options);
  },
};
export type { ScanOptions, ScanResult, ScannedPage } from './types';
