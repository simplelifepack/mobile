import {
  resolveMimeType,
  sanitizeFileName,
  toFileUri,
  toLocalPath,
} from './filePolicy';

describe('filePolicy', () => {
  it('strips file scheme and decodes local paths', () => {
    expect(toLocalPath('file:///tmp/my%20file.pdf')).toBe('/tmp/my file.pdf');
    expect(toLocalPath('/tmp/a.pdf')).toBe('/tmp/a.pdf');
  });

  it('adds the file scheme only when missing', () => {
    expect(toFileUri('/tmp/a')).toBe('file:///tmp/a');
    expect(toFileUri('file:///tmp/a')).toBe('file:///tmp/a');
  });

  it('sanitizes traversal, control characters and length', () => {
    expect(sanitizeFileName('../../etc/pass\u0000wd.pdf')).toBe('pass_wd.pdf');
    expect(sanitizeFileName(null)).toBe('document');
    expect(sanitizeFileName('a'.repeat(400))).toHaveLength(255);
  });

  it('prefers a declared mime type and falls back to the extension', () => {
    expect(resolveMimeType('image/PNG; charset=x', 'a.bin')).toBe('image/png');
    expect(resolveMimeType(undefined, 'scan.JPG')).toBe('image/jpeg');
    expect(() => resolveMimeType('text/plain', 'a.txt')).toThrow(/Choose a PDF/);
  });
});
