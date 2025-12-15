import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { generateAccessToken } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import { validateTOTP } from '$lib/server/totp';
import { defs } from '$lib/utils/form';
import z from 'zod';
import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';

export const actions: Actions = {
  logIn: async ({ request, cookies }) => {
    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        username: defs.username,
        password: defs.password,
        rememberMe: defs.checkbox,
        totp: z.string().optional(),
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);

      const { username, password, rememberMe, totp: totpCode } = form.data;

      const user = await UserDAO.getUserByUsername(username);
      // If user has a passkey, they must log in with WebAuthn
      if (user.passkey) {
        return fail(400, {
          action: 'logIn',
          error: true,
          mustUsePasskey: true,
        });
      }
      const compare = await bcrypt.compare(password, user.passwordHash!);

      if (!compare) throw new Error('errors.auth.invalidCredentials');

      if (user.totpSecret) {
        if (!totpCode) {
          return fail(400, {
            action: 'logIn',
            error: true,
            noTOTPCode: true,
          });
        }

        const result = await validateTOTP(user.totpSecret, totpCode);
        if (!result) {
          throw new Error('errors.auth.totp.invalidCode');
        }
      }

      cookies.set(getCookiePrefix('token'), generateAccessToken(user.id), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined, // 30 days if rememberMe is true
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error creating user account :', msg);
      return fail(400, {
        action: 'logIn',
        error: true,
        message: msg || 'errors.server.connectionRefused',
      });
    }
    redirect(303, '/app/account');
  },
};
