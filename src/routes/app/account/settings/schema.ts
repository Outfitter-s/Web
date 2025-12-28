import { defs } from '$lib/utils';
import z from 'zod';
import { UUID } from '$lib/types';

export const usernameSchema = z.object({
  username: defs.username,
});

export const emailSchema = z.object({
  email: defs.email,
});

export const passwordSchema = z.object({
  currentPassword: defs.password,
  newPassword: defs.password,
  confirmPassword: defs.password,
});

export const profilePictureSchema = z.object({
  profilePicture: z.instanceof(File, {
    message: 'errors.account.settings.invalidProfilePicture',
  }),
});

export const unlinkTOTPSchema = z.object({
  totp: z.string(),
});

export const removeTokenSchema = z.object({
  tokenId: UUID,
});
