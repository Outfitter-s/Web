import { json } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import speakeasy from 'speakeasy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user!;
  try {
    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generate QR Code url
    const otpAuthUrl =
      secret.otpauth_url ??
      `otpauth://totp/outfitter:${user.email}?secret=${secret.base32}&issuer=outfitter`;

    return json({ url: otpAuthUrl, secret: secret.base32 });
  } catch (error) {
    logger.error('Error generating TOTP Token :', error);
    return json({ message: 'errors.errorGeneratingTOTP' }, { status: 500 });
  }
};
