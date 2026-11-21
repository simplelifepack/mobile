import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { FileSystem } from 'react-native-file-access';
import { resolveMimeType, sanitizeFileName, toLocalPath } from './filePolicy';
import type { SelectedDocument } from './types';

// iOS cannot present the picker while the action sheet or modal is still dismissing.
const PICKER_PRESENT_DELAY_MS = 450;

let pickerOpen = false;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function selectDocumentFiles(): Promise<SelectedDocument[] | undefined> {
  if (pickerOpen) return undefined;
  pickerOpen = true;
  const copiedPaths: string[] = [];
  try {
    await wait(PICKER_PRESENT_DELAY_MS);
    const picked = await pick({
      type: [types.pdf, types.images],
      mode: 'import',
      allowMultiSelection: true,
    });
    const files = picked.map(file => {
      const fileName = sanitizeFileName(file.name);
      return { file, fileName, mimeType: resolveMimeType(file.type, fileName) };
    });
    const [first, ...rest] = files;
    if (!first) return undefined;
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const copyFile = ({ file, fileName }: typeof first, index: number) => ({
      uri: file.uri,
      fileName: `readiness-import-${batchId}-${index}-${fileName}`.slice(0, 255),
    });
    const copies = await keepLocalCopy({
      files: [copyFile(first, 0), ...rest.map((file, index) => copyFile(file, index + 1))],
      destination: 'cachesDirectory',
    });
    for (const copy of copies) {
      if (copy.status === 'success') copiedPaths.push(toLocalPath(copy.localUri));
    }
    if (copies.length !== files.length || copies.some(copy => copy.status !== 'success')) {
      const failed = copies.find(copy => copy.status !== 'success');
      throw new Error(failed?.status === 'error' ? failed.copyError || 'Unable to access a selected file.' : 'Unable to access the selected files.');
    }
    return files.map((file, index) => ({
      path: copiedPaths[index],
      fileName: file.fileName,
      mimeType: file.mimeType,
    }));
  } catch (error) {
    await Promise.all(copiedPaths.map(async path => {
      try {
        await FileSystem.unlink(path);
      } catch (cleanupError) {
        console.warn('[documents] unable to remove temporary file', cleanupError);
      }
    }));
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return undefined;
    }
    throw error;
  } finally {
    pickerOpen = false;
  }
}

export async function selectDocumentFile(): Promise<SelectedDocument | undefined> {
  if (pickerOpen) return undefined;
  pickerOpen = true;
  try {
    await wait(PICKER_PRESENT_DELAY_MS);
    const [picked] = await pick({
      type: [types.pdf, types.images],
      mode: 'import',
      allowMultiSelection: false,
    });
    const fileName = sanitizeFileName(picked.name);
    const mimeType = resolveMimeType(picked.type, fileName);
    const [copy] = await keepLocalCopy({
      files: [{ uri: picked.uri, fileName }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') {
      throw new Error(copy.copyError || 'Unable to access the selected file.');
    }
    return { path: toLocalPath(copy.localUri), fileName, mimeType };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return undefined;
    }
    throw error;
  } finally {
    pickerOpen = false;
  }
}

const PHOTO_OPTIONS = {
  mediaType: 'photo',
  assetRepresentationMode: 'compatible',
  quality: 1,
} as const;

export async function selectImagesFromGallery(): Promise<SelectedDocument[] | undefined> {
  if (pickerOpen) return undefined;
  pickerOpen = true;
  try {
    await wait(PICKER_PRESENT_DELAY_MS);
    const result = await launchImageLibrary({ ...PHOTO_OPTIONS, selectionLimit: 0 });
    if (result.didCancel) return undefined;
    if (result.errorCode) {
      throw new Error(result.errorMessage || 'Unable to open the image picker.');
    }
    if (!result.assets?.length) {
      throw new Error('No images were returned by the gallery.');
    }
    try {
      return result.assets.map(asset => {
        if (!asset.uri?.startsWith('file://')) {
          throw new Error('Unable to access a selected image.');
        }
        const fileName = sanitizeFileName(asset.fileName);
        return {
          path: toLocalPath(asset.uri),
          fileName,
          mimeType: resolveMimeType(asset.type ?? 'image/jpeg', fileName),
        };
      });
    } catch (error) {
      await Promise.all(result.assets.map(async asset => {
        if (!asset.uri?.startsWith('file://')) return;
        try {
          await FileSystem.unlink(toLocalPath(asset.uri));
        } catch (cleanupError) {
          console.warn('[documents] unable to remove temporary image', cleanupError);
        }
      }));
      throw error;
    }
  } finally {
    pickerOpen = false;
  }
}

async function selectPhoto(useCamera: boolean): Promise<SelectedDocument | undefined> {
  if (pickerOpen) return undefined;
  pickerOpen = true;
  let result;
  try {
    await wait(PICKER_PRESENT_DELAY_MS);
    result = useCamera
      ? await launchCamera({ ...PHOTO_OPTIONS, cameraType: 'back' })
      : await launchImageLibrary({ ...PHOTO_OPTIONS, selectionLimit: 1 });
  } finally {
    pickerOpen = false;
  }

  if (result.didCancel) return undefined;
  if (result.errorCode) {
    throw new Error(result.errorMessage || 'Unable to open the image picker.');
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) return undefined;
  const fileName = sanitizeFileName(asset.fileName);
  return {
    path: toLocalPath(asset.uri),
    fileName,
    mimeType: resolveMimeType(asset.type ?? 'image/jpeg', fileName),
  };
}

export const selectImageFromGallery = () => selectPhoto(false);
export const captureDocumentPhoto = () => selectPhoto(true);
