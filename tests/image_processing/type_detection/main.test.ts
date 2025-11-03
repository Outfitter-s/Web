import { ImageProcessor } from '$lib/server/imageProcessing';
import { readFileSync } from 'fs';
import type { ClothingItemType, ClothingItemColor } from '$lib/types';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const HERE = dirname(__filename);

function getImageBuffer(id: string): Buffer {
  const path = join(HERE, `assets/${id}.png`);
  return readFileSync(path);
}

interface ImageResult {
  detectedType: ClothingItemType | null;
  detectedColor: ClothingItemColor;
}

interface ImageInput {
  id: string;
  color: ClothingItemColor;
  type: ClothingItemType;
}

const images: ImageInput[] = [
  {
    id: '4c83404385454651a2494c6914412467',
    color: 'white',
    type: 'shirt',
  },
  {
    id: '5d7b7944fcfd41e5a7aaa2a038a84d96',
    color: 'blue',
    type: 'pants',
  },
  {
    id: '9e0aae7263884671817a8baa03627c90',
    color: 'blue',
    type: 'pants',
  },
  {
    id: '69399074f269437993682e0219843700',
    color: 'white',
    type: 'accessory',
  },
  {
    id: 'b7ae72792840444ea2b859efc25abc4d',
    color: 'black',
    type: 'pants',
  },
];

async function processImage(buffer: Buffer): Promise<ImageResult> {
  const cleanedUpImage = await ImageProcessor.removeBackground(buffer);
  const { type: detectedType, color: detectedColor } =
    await ImageProcessor.processImage(cleanedUpImage);
  return { detectedType, detectedColor };
}

test('Test de detection avec 5 images', async () => {
  for (const image of images) {
    const buffer = getImageBuffer(image.id);
    const result = await processImage(buffer);
    expect(result.detectedType).toBe(image.type);
    expect(result.detectedColor).toBe(image.color);
  }
});
