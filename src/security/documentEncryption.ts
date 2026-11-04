export type EncryptionResult = {
  encryptedPath: string;
  algorithm: 'AES-256-GCM';
  keyId: string;
};
export interface DocumentEncryptionProvider {
  encrypt(
    sourcePath: string,
    destinationPath: string,
  ): Promise<EncryptionResult>;
  decrypt(sourcePath: string, destinationPath: string): Promise<void>;
}
export class EncryptionNotConfiguredError extends Error {
  constructor() {
    super('Native document encryption is not configured yet.');
  }
}
export const documentEncryption: DocumentEncryptionProvider = {
  async encrypt() {
    throw new EncryptionNotConfiguredError();
  },
  async decrypt() {
    throw new EncryptionNotConfiguredError();
  },
};
