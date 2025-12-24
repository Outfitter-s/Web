import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import type { Actions, PageServerLoad } from './$types';
import { generateAccessToken } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setError, superValidate, fail } from 'sveltekit-superforms';
import { formSchema } from './schema';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(formSchema)),
  };
};

export const actions: Actions = {
  signUp: async (event) => {
    const { cookies } = event;
    const form = await superValidate(event, zod4(formSchema));
    if (!form.valid) return fail(400, { form });
    const { username, email, password, rememberMe } = form.data;
    try {
      await UserDAO.credentialsExists(username, email);
    } catch (e) {
      return setError(form, 'totp', (e as Error).message);
    }
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const createdUser = await UserDAO.createUser(username, email, hash);
      cookies.set(getCookiePrefix('token'), generateAccessToken(createdUser.id), {
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
        action: 'signUp',
        error: true,
        message: msg,
      });
    }

    redirect(303, '/app/account');
  },
};
