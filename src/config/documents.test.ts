import { MAX_DOCUMENT_UPLOAD_BYTES, validateDocumentUpload } from './documents';
const file = (type = 'application/pdf', size = 10) => ({
  name: 'synthetic',
  type,
  size,
});
it('enforces the same per-file bound as the backend', () => {
  expect(() =>
    validateDocumentUpload([
      file('application/pdf', MAX_DOCUMENT_UPLOAD_BYTES + 1),
    ]),
  ).toThrow('10 MB');
});
it('enforces the combined image bound without applying it to separate PDFs', () => {
  expect(() =>
    validateDocumentUpload([
      file('image/jpeg', 6 * 1024 * 1024),
      file('image/png', 6 * 1024 * 1024),
    ]),
  ).toThrow('Selected images');
  expect(() =>
    validateDocumentUpload([
      file('application/pdf', 6 * 1024 * 1024),
      file('application/pdf', 6 * 1024 * 1024),
    ]),
  ).not.toThrow();
});
it('rejects unsupported, empty and excessive uploads before encryption', () => {
  expect(() => validateDocumentUpload([file('image/heic')])).toThrow('PDF');
  expect(() => validateDocumentUpload([file('application/pdf', 0)])).toThrow(
    'empty',
  );
  expect(() =>
    validateDocumentUpload(Array.from({ length: 51 }, () => file())),
  ).toThrow('50');
});
