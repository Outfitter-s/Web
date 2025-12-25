import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { Caching } from '$lib/server/db/caching';
import { logger } from '$lib/utils/logger';
import { UserDAO } from '$lib/server/db/user';
import bcrypt from 'bcryptjs';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { formSchema } from './schema';

export const load = (async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    if (!searchParams.has('token')) throw new Error('errors.auth.passwordReset.noToken');

    const token = searchParams.get('token') as string;

    const email = await Caching.get<string>(`passwordReset:${token}`);
    if (!email) throw new Error('errors.auth.passwordReset.expiredToken');
    return {
      token,
      form: await superValidate(zod4(formSchema), {
        defaults: { token },
      }),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error(message);
    return error(400, { message });
  }
}) satisfies PageServerLoad;

export const actions: Actions = {
  resetPassword: async (event) => {
    const form = await superValidate(event, zod4(formSchema));
    if (!form.valid) return fail(400, { form });
    const { password, token, confirmPassword } = form.data;
    const email = await Caching.get<string>(`passwordReset:${token}`);
    if (!email) return fail(400, { form, message: 'errors.auth.passwordReset.expiredToken' });
    if (password !== confirmPassword)
      return message(form, 'errors.auth.passwordReset.passwordsDontMatch');

    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const user = await UserDAO.getUserByEmail(email);

      await UserDAO.updateUser(user.id, { passwordHash: hash });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Error resetting password :', msg);
      return message(form, msg);
    }

    return message(form, 'successes.resetPassword');
  },
};
