import { json } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import speakeasy from 'speakeasy';
import type { RequestHandler } from './$types';
import type { User } from '$lib/types';
import config from '$conf';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as User;
  const projectName = config.project_name;
  try {
    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generate QR Code url
    const otpAuthUrl =
      secret.otpauth_url ??
      `otpauth://totp/${projectName}:${user.email}?secret=${secret.base32}&issuer=${projectName}`;

    return json({ url: otpAuthUrl, secret: secret.base32 });
  } catch (error) {
    logger.error('Error generating TOTP Token :', error);
    return json({ message: 'errors.errorGeneratingTOTP' }, { status: 500 });
  }
};
