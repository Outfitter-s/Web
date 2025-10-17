import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { generateAccessToken } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import { defs } from '$lib/utils/form';
import z from 'zod';
import { env } from '$env/dynamic/private';

export const actions: Actions = {
  signUp: async ({ request, cookies }) => {
    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        email: defs.email,
        username: defs.username,
        password: defs.password,
        rememberMe: defs.checkbox,
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);

      const { username, email, password, rememberMe } = form.data;
      await UserDAO.credentialsExists(username, email);
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const createdUser = await UserDAO.createUser(username, email, hash);
      cookies.set('token', generateAccessToken(createdUser.id), {
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
        message: msg || 'errors.server.connectionRefused',
      });
    }

    redirect(303, '/app');
  },
};
