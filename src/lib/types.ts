import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/browser';
import z from 'zod';

// Generics
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

// Domain Entities
export const UserZ = z.object({
  id: UUID,
  username: z.string().min(3).max(30),
  email: z.email(),
  passwordHash: z.string().optional(),
  createdAt: DateZ,
  totpSecret: z.string().optional(),
  passkey: z.any().nullable(),
  following: z.array(UUID).default([]),
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
export const roles = ['user', 'admin'] as const; // Keep the roles in order of power (used by `isRoleBelow` in `./roles/index.ts`)
export type Role = (typeof roles)[number];

// Clothing Item
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

export const ClothingItemZ = z.object({
  id: UUID.or(z.string()),
  imageUrl: z.url(),
  type: z.enum(clothingItemTypes),
  color: z.enum(clothingItemColors),
  createdAt: DateZ,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  lastWornAt: DateZ.nullable(),
  userId: UUID,
});
export type ClothingItem = z.infer<typeof ClothingItemZ>;

export type ClothingItemsByType = Record<ClothingItemType, ClothingItem[]>;
export type ScoredClothingItem = ClothingItem & { score: number };

// Outfit
export const OutfitZ = z.object({
  id: UUID,
  items: z.array(ClothingItemZ),
  createdAt: DateZ,
});
export type Outfit = z.infer<typeof OutfitZ>;
export const OutfitPreviewZ = OutfitZ.omit({ createdAt: true, id: true });
export type OutfitPreview = z.infer<typeof OutfitPreviewZ>;

// Weather
export const WeatherZ = z.object({
  temp: z.number(),
  rain: z.number(),
  uv: z.number(),
});
export type Weather = z.infer<typeof WeatherZ>;

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

// Outfit generation
export const CLOTHING_STYLES = ['default', 'comfort', 'new', 'style', 'formal'] as const;
export type ClothingStyles = (typeof CLOTHING_STYLES)[number];
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

export interface SwiperCard {
  id: number;
  outfit: OutfitPreview | Outfit;
}

// Post - comment
export interface Comment {
  id: UUID | string;
  postId: UUID | null;
  commentId: UUID | null;
  content: string;
  createdAt: Date;
  user: User;
  replies: Comment[];
}

export const CommentZ: z.ZodType<Comment> = z.lazy(() =>
  z
    .object({
      id: UUID.or(z.string()),
      postId: UUID.nullable(),
      commentId: UUID.nullable(),
      content: z.string().min(1).max(500),
      createdAt: DateZ,
      user: UserZ,
      replies: z.array(CommentZ).default([]),
    })
    .refine((data) => data.postId !== null || data.commentId !== null, {
      message: 'Either postId or commentId must be provided',
    })
);

// Post - reaction
export const reactions = ['love', 'like', 'haha', 'wow', 'sad'] as const;
export type Reactions = (typeof reactions)[number];
export const ReactionZ = z.object({
  postId: UUID,
  userId: UUID,
  type: z.enum(reactions),
  createdAt: DateZ,
});
export type Reaction = z.infer<typeof ReactionZ>;
export type PostReactions = {
  [key in Reactions]: number;
};

// Post - publication
export const PublicationImagesLengths = { min: 1, max: 6 };
export const PublicationZ = z.object({
  id: UUID.or(z.string()),
  images: z.array(z.url()).min(PublicationImagesLengths.min).max(PublicationImagesLengths.max),
  user: UserZ,
  description: z.string(),
  outfit: OutfitZ.optional(),
  reactions: z.record(z.enum(reactions), z.number()).default({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
  }),
  userReaction: z.enum(reactions).optional(),
  createdAt: DateZ,
});
export type Publication = z.infer<typeof PublicationZ>;
export const feedTypes = ['forYou', 'followed'];
export type FeedType = (typeof feedTypes)[number];

export const ICSTokenZ = z.object({
  id: UUID,
  userId: UUID,
});
export type ICSToken = z.infer<typeof ICSTokenZ>;
