import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/browser';

export type UUID /* UUID v4 */ = `${string}-${string}-${string}-${string}-${string}`;
type MyOptional<T> = T | null;
export const clothingItemTypes = ['top', 'bottom', 'shoes', 'accessory'] as const;
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
export interface User {
  id: UUID;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  totpSecret?: string;
  passkey: Passkey | null;
}

export interface Passkey {
  id: Base64URLString;
  publicKey: Uint8Array;
  webauthnUserID: Base64URLString;
  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
}

export interface ClothingItem {
  id: UUID;
  imageUrl: string;
  type: ClothingItemType;
  color: ClothingItemColor;
  createdAt: Date;
  name: string;
  description: string;
  lastWornAt: MyOptional<Date>;
}

export interface Outfit {
  id: UUID;
  top: MyOptional<ClothingItem>;
  bottom: MyOptional<ClothingItem>;
  shoes: MyOptional<ClothingItem>;
  accessories: ClothingItem[];
  createdAt: Date;
  wornAt: Date[];
}

export interface SwiperCard {
  id: number;
  title: string;
  description?: string;
  imageSrc: string;
}
