import { FileSystem } from 'react-native-file-access';
import type { PickedDocument } from './documentFiles';
import { DocumentScanner } from './documentScanner';
import { handleScannerPermissionError } from './documentScanner/permission';

/** Use the same native scanner and permission handling in every document flow. */
export async function captureDocuments(): Promise<PickedDocument[]> {
  try {
    const result = await DocumentScanner.scan({
      pageLimit: 50,
      allowGalleryImport: true,
    });
    return await Promise.all(
      result.pages.map(async page => ({
        uri: page.localPath.startsWith('file://')
          ? page.localPath
          : `file://${page.localPath}`,
        name: `scan-${page.pageNumber}.jpg`,
        type: page.mimeType,
        size: Number(
          (await FileSystem.stat(page.localPath.replace('file://', ''))).size,
        ),
      })),
    );
  } catch (error) {
    if (handleScannerPermissionError(error)) return [];
    throw error;
  }
}
