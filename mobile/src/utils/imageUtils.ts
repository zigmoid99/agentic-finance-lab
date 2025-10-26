import * as FileSystem from 'expo-file-system';

export async function convertImageToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export function getDataUrl(base64: string, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${base64}`;
}
