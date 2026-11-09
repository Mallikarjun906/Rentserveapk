// Cross-Platform Form Data File Helper for React Native Mobile & Web
import { Platform } from 'react-native';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
  file?: any;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImage(file: UploadFile | null): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No image selected.' };
  if (file.size && file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Selected photo exceeds the 5 MB limit. Please select a smaller photo.' };
  }
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const isImage =
    type.includes('jpeg') ||
    type.includes('jpg') ||
    type.includes('png') ||
    type.includes('webp') ||
    name.match(/\.(jpg|jpeg|png|webp)$/i);

  if (!isImage) {
    return { valid: false, error: 'Only JPG, JPEG, and PNG images are supported.' };
  }
  return { valid: true };
}

export function validateDocument(file: UploadFile | null): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No document selected.' };
  if (file.size && file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Selected file exceeds the 5 MB limit.' };
  }
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const isAllowed =
    type.includes('pdf') ||
    type.includes('jpeg') ||
    type.includes('jpg') ||
    type.includes('png') ||
    type.includes('webp') ||
    name.match(/\.(pdf|jpg|jpeg|png|webp)$/i);

  if (!isAllowed) {
    return { valid: false, error: 'Only PDF, JPG, and PNG documents are supported.' };
  }
  return { valid: true };
}

export async function appendFileToFormData(
  formData: FormData,
  fieldName: string,
  file: UploadFile | null
): Promise<void> {
  if (!file || !file.uri) return;

  if (Platform.OS === 'web') {
    // If browser File or Blob is available
    if (file.file && typeof Blob !== 'undefined' && file.file instanceof Blob) {
      (formData as any).append(fieldName, file.file, file.name);
      return;
    }

    // Try fetching the blob from data URI or blob URL
    if (file.uri.startsWith('blob:') || file.uri.startsWith('data:')) {
      try {
        const resp = await fetch(file.uri);
        const blob = await resp.blob();
        (formData as any).append(fieldName, blob, file.name);
        return;
      } catch (e) {
        console.warn('Could not fetch blob from URI in web:', e);
      }
    }

    // Fallback on web
    formData.append(
      fieldName,
      {
        uri: file.uri,
        name: file.name,
        type: file.type || 'image/jpeg',
      } as any
    );
  } else {
    // React Native Native (Android / iOS)
    formData.append(
      fieldName,
      {
        uri: file.uri,
        name: file.name,
        type: file.type || 'image/jpeg',
      } as any
    );
  }
}
