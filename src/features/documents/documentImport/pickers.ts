import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { resolveMimeType, sanitizeFileName, toLocalPath } from './filePolicy';
import type { SelectedDocument } from './types';

// iOS cannot present the picker while the action sheet or modal is still dismissing.
const PICKER_PRESENT_DELAY_MS = 450;

let pickerOpen = false;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

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
