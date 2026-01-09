import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import type { Actions, PageServerLoad } from './$types';
import { generateAccessToken } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { validateTOTP } from '$lib/server/totp';
import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setError, superValidate, fail, message } from 'sveltekit-superforms';
import { formSchema } from './schema';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(formSchema)),
  };
};

export const actions: Actions = {
  logIn: async (event) => {
    const { cookies } = event;
    const form = await superValidate(event, zod4(formSchema));
    if (!form.valid) return fail(400, { form });

    const { username, password, rememberMe, totp: totpCode } = form.data;

    const user = await UserDAO.getUserByUsername(username);
    if (!user) {
      return setError(form, 'username', 'errors.auth.badUsername');
    }
    // If user has a passkey, they must log in with WebAuthn
    if (user.passkey) {
      return message(form, {
        mustUsePasskey: true,
      });
    }
    const compare = await bcrypt.compare(password, user.passwordHash!);

    if (!compare) return setError(form, 'password', 'errors.auth.invalidCredentials');

    if (user.totpSecret) {
      if (!totpCode) {
        return message(form, {
          noTOTPCode: true,
        });
      }
      try {
        await validateTOTP(user.totpSecret, totpCode);
      } catch {
        return setError(form, 'totp', 'errors.auth.totp.invalidCode');
      }
    }

    cookies.set(getCookiePrefix('token'), generateAccessToken(user.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined, // 30 days if rememberMe is true
    });
    redirect(303, '/app/account');
  },
};
