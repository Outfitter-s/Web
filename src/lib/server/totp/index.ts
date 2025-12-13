import { logger } from '$lib/utils/logger';
import type { User } from '$lib/types';
import speakeasy from 'speakeasy';
import { UserDAO } from '$lib/server/db/user';

export const validateTOTP = async (secret: string, token: string) => {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allows some leeway for clock drift
  });
  if (!verified) throw new Error('errors.auth.totp.invalidToken');

  return verified;
};

export const registerTOTP = async (user: User) => {
  try {
    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({ length: 20 });

    // Store secret in database
    await UserDAO.setTOTPSecret(user.id, secret.base32);

    // Generate QR Code url
    const otpAuthUrl =
      secret.otpauth_url ??
      `otpauth://totp/outfitter:${user.email}?secret=${secret.base32}&issuer=outfitter`;

    return otpAuthUrl;
  } catch (error) {
    logger.error('Error generating TOTP:', error);
    throw new Error('errors.auth.totp.registerFailed');
  }
};
