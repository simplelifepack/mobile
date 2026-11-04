export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;
export function validateDocumentUpload(
  files: Array<{ name: string; type: string; size: number }>,
) {
  if (!files.length || files.length > 50)
    throw new Error('Choose between 1 and 50 files.');
  let imageBytes = 0;
  for (const file of files) {
    if (
      !['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
        file.type,
      )
    )
      throw new Error('Choose a PDF, JPEG, PNG or WebP file.');
    if (!Number.isInteger(file.size) || file.size <= 0)
      throw new Error('This file is empty. Choose another file.');
    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES)
      throw new Error('Files must be 10 MB or smaller.');
    if (file.type.startsWith('image/')) imageBytes += file.size;
  }
  if (imageBytes > MAX_DOCUMENT_UPLOAD_BYTES)
    throw new Error(
      'Selected images exceed 10 MB. Remove or compress some pages.',
    );
}
