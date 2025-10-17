import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { Redis } from '$lib/server/db/caching';
import { logger } from '$lib/utils/logger';
import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import { defs } from '$lib/utils/form';
import z from 'zod';

export const load = (async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    if (!searchParams.has('token')) throw new Error('errors.auth.passwordReset.noToken');

    const token = searchParams.get('token') as string;

    const email = await Redis.get<string>(`passwordReset:${token}`);
    if (!email) throw new Error('errors.auth.passwordReset.expiredToken');
    return { email, token };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error(message);
    return error(400, { message });
  }
}) satisfies PageServerLoad;

export const actions: Actions = {
  resetPassword: async ({ request }) => {
    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        password: defs.password,
        confirmPassword: defs.password,
        token: z.string().min(1, 'errors.auth.passwordReset.noToken'),
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);

      const { password, confirmPassword, token } = form.data;
      const email = await Redis.get<string>(`passwordReset:${token}`);
      if (!email) throw new Error('errors.auth.passwordReset.expiredToken');

      if (password !== confirmPassword)
        throw new Error('errors.auth.passwordReset.passwordsDontMatch');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const user = await UserDAO.getUserByEmail(email);

      await UserDAO.updateUser(user.id, { passwordHash: hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return { action: 'resetPassword', error: true, message: msg };
    }

    return { action: 'resetPassword', success: true, message: 'successes.resetPassword' };
  },
};
