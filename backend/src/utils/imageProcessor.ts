import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import exifr from 'exifr';

export interface ImageMetadata {
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  width?: number;
  height?: number;
}

export const extractMetadata = async (filePath: string): Promise<ImageMetadata> => {
  try {
    const exifData = await exifr.parse(filePath, {
      gps: true,
      exif: true,
      iptc: false,
      jfif: false,
      ihdr: false,
    });

    const metadata: ImageMetadata = {};

    if (exifData) {
      // Extract GPS coordinates
      if (exifData.latitude && exifData.longitude) {
        metadata.latitude = exifData.latitude;
        metadata.longitude = exifData.longitude;
      }

      // Extract date taken
      if (exifData.DateTimeOriginal) {
        metadata.takenAt = new Date(exifData.DateTimeOriginal);
      } else if (exifData.DateTime) {
        metadata.takenAt = new Date(exifData.DateTime);
      }
    }

    // Get image dimensions
    const imageInfo = await sharp(filePath).metadata();
    metadata.width = imageInfo.width;
    metadata.height = imageInfo.height;

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {};
  }
};

export const createThumbnail = async (
  filePath: string,
  thumbnailWidth: number = 300
): Promise<string> => {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const thumbnailPath = path.join(dir, `${basename}-thumb${ext}`);

    await sharp(filePath)
      .resize(thumbnailWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
