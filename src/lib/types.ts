import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/browser';
import z from 'zod';

export const UUID = z.uuidv4();
export type UUID = z.infer<typeof UUID>;
export const DateZ = z.date().or(
  z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date string',
    })
    .transform((date) => new Date(date))
);
export const clothingItemTypes = [
  'pants',
  'sweater',
  'dress',
  'jacket',
  'shirt',
  'shoes',
  'accessory',
] as const;
export type ClothingItemType = (typeof clothingItemTypes)[number];
export const clothingItemColors = [
  'red',
  'blue',
  'green',
  'black',
  'white',
  'yellow',
  'purple',
  'orange',
  'pink',
  'brown',
  'gray',
] as const;
export type ClothingItemColor = (typeof clothingItemColors)[number];

export const UserZ = z.object({
  id: z.uuidv4(),
  username: z.string().min(3).max(30),
  email: z.email(),
  passwordHash: z.string(),
  createdAt: DateZ,
  totpSecret: z.string().optional(),
  passkey: z.any().nullable(),
});
export type User = z.infer<typeof UserZ>;

export interface Passkey {
  id: Base64URLString;
  publicKey: Uint8Array;
  webauthnUserID: Base64URLString;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

export const ClothingItemZ = z.object({
  id: z.uuidv4().or(z.string()),
  imageUrl: z.url(),
  type: z.enum(clothingItemTypes),
  color: z.enum(clothingItemColors),
  createdAt: DateZ,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  lastWornAt: DateZ.nullable(),
});
export type ClothingItem = z.infer<typeof ClothingItemZ>;

export type ScoredClothingItem = ClothingItem & { score: number };

export const OutfitZ = z.object({
  id: z.uuidv4(),
  top: z.array(ClothingItemZ).min(1),
  bottom: ClothingItemZ.nullable(),
  shoes: ClothingItemZ.nullable(),
  accessories: z.array(ClothingItemZ),
  createdAt: DateZ,
});
export type Outfit = z.infer<typeof OutfitZ>;
export const OutfitPreviewZ = OutfitZ.omit({ createdAt: true, id: true });
export type OutfitPreview = z.infer<typeof OutfitPreviewZ>;

export interface SwiperCard {
  id: number;
  outfit: OutfitPreview | Outfit;
}

export const WeatherZ = z.object({
  temp: z.number(),
  rain: z.number(),
  uv: z.number(),
});
export type Weather = z.infer<typeof WeatherZ>;

export const roles = ['user', 'admin'] as const; // Keep the roles in order of power (used by `isRoleBelow` in `./roles/index.ts`)
export type Role = (typeof roles)[number];

export type ByType = Record<ClothingItemType, ClothingItem[]>;

export const emptyByType = (): ByType => ({
  pants: [],
  sweater: [],
  dress: [],
  jacket: [],
  shirt: [],
  shoes: [],
  accessory: [],
});

export const NEUTRAL_COLORS: ClothingItemColor[] = ['white', 'black', 'gray', 'brown'];

export const COLOR_WHEEL: ClothingItemColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'white',
  'black',
  'gray',
  'brown',
];

export const CLOTHING_STYLES = ['default', 'comfort', 'new', 'style', 'formal'] as const;
export type ClothingStyles = (typeof CLOTHING_STYLES)[number];

export const PROFILE_WEIGHTS: Record<
  ClothingStyles,
  { temp: number; rain: number; uv: number; lastWorn: number; color: number }
> = {
  comfort: { temp: 0.3, rain: 0.3, uv: 0.2, lastWorn: 0.1, color: 0.1 },
  new: { temp: 0.2, rain: 0.2, uv: 0.1, lastWorn: 0.4, color: 0.1 },
  style: { temp: 0.1, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.3 },
  formal: { temp: 0.1, rain: 0.1, uv: 0.1, lastWorn: 0.1, color: 0.6 },
  default: { temp: 0.2, rain: 0.2, uv: 0.2, lastWorn: 0.2, color: 0.2 },
};

export const TEMP_IDEALS: Record<ClothingItemType | 'default', { ideal: number; tol: number }> = {
  jacket: { ideal: 6, tol: 10 },
  sweater: { ideal: 12, tol: 8 },
  pants: { ideal: 18, tol: 12 },
  dress: { ideal: 22, tol: 8 },
  shirt: { ideal: 20, tol: 8 },
  shoes: { ideal: 20, tol: 12 },
  accessory: { ideal: 20, tol: 15 },
  default: { ideal: 20, tol: 10 },
};
