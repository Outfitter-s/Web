import { clothingItemTypes, type ClothingItemColor, type ClothingItemType } from '$lib/types';
import ColorThief from 'colorthief';
import { getEnv } from '../utils';
import { logger } from '$lib/utils/logger';
type RGB = [number, number, number];

const clothingItemColorsMapping: Record<ClothingItemColor, RGB> = {
  red: [220, 20, 60],
  blue: [30, 144, 255],
  green: [34, 139, 34],
  black: [0, 0, 0],
  white: [255, 255, 255],
  yellow: [255, 215, 0],
  purple: [128, 0, 128],
  orange: [255, 140, 0],
  pink: [255, 105, 180],
  brown: [139, 69, 19],
  gray: [128, 128, 128],
};

export class ImageProcessor {
  static async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    const formData = new FormData();
    formData.append('file', new File([new Uint8Array(imageBuffer)], 'file.png'));
    const res = await fetch(
      getEnv('IMAGE_PROCESSING_API_ORIGIN', 'http://localhost:5000') + '/remove',
      {
        body: formData,
        method: 'POST',
        headers: {
          'X-API-Key': getEnv('IMAGE_PROCESSING_API_KEY', ''),
        },
      }
    );
    const body = await res.arrayBuffer();
    return Buffer.from(body);
  }

  static async getImageColor(imageBuffer: Buffer): Promise<ClothingItemColor> {
    // @ts-expect-error because ColorThief types are incorrect
    const color = (await ColorThief.getColor(imageBuffer)) as RGB;
    let minDist = Infinity;
    let closest: ClothingItemColor = 'black';

    for (const [name, rgb] of Object.entries(clothingItemColorsMapping)) {
      const d = Math.sqrt(
        (rgb[0] - color[0]) ** 2 + (rgb[1] - color[1]) ** 2 + (rgb[2] - color[2]) ** 2
      );
      if (d < minDist) {
        minDist = d;
        closest = name as ClothingItemColor;
      }
    }
    return closest;
  }

  static async predictClothingType(imageBuffer: Buffer): Promise<ClothingItemType | null> {
    try {
      const formData = new FormData();
      formData.append('file', new File([new Uint8Array(imageBuffer)], 'file.png'));
      const res = await fetch(
        getEnv('IMAGE_PROCESSING_API_ORIGIN', 'http://localhost:5000') + '/classify',
        {
          body: formData,
          method: 'POST',
          headers: {
            'X-API-Key': getEnv('IMAGE_PROCESSING_API_KEY', ''),
          },
        }
      );
      const index = await res.json();

      return clothingItemTypes[index];
    } catch (error) {
      logger.error('Error predicting clothing type:', error);
      return null;
    }
  }

  static async processImage(
    imageBuffer: Buffer
  ): Promise<{ type: ClothingItemType | null; color: ClothingItemColor }> {
    const [type, color] = await Promise.all([
      this.predictClothingType(imageBuffer),
      this.getImageColor(imageBuffer),
    ]);
    return { type, color };
  }
}
