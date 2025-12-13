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
  wornAt: z.array(DateZ),
});
export type Outfit = z.infer<typeof OutfitZ>;

export interface SwiperCard {
  id: number;
  outfit: Omit<Outfit, 'id'>;
}

export const WeatherZ = z.object({
  temp: z.number(),
  rain: z.number(),
  desc: z.string(),
  uv: z.number(),
});
export type Weather = z.infer<typeof WeatherZ>;

export const roles = ['user', 'admin'] as const; // Keep the roles in order of power (used by `isRoleBelow` in `./roles/index.ts`)
export type Role = (typeof roles)[number];
