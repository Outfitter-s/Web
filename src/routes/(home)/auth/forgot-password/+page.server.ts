import { UserDAO } from '$lib/server/db/user';
import { resetPasswordRequest } from '$lib/server/mail/transactional';
import type { Actions } from './$types';
import { logger } from '$lib/utils/logger';
import { defs } from '$lib/utils/form';
import z from 'zod';

export const actions: Actions = {
  resetPassword: async ({ request, url }) => {
    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        email: defs.email,
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);

      const { email } = form.data;
      const id = await UserDAO.requestPasswordReset(email);

      await resetPasswordRequest(email, url, id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return { error: true, message: msg, action: 'resetPassword' };
    }

    return { action: 'resetPassword', success: true, message: 'successes.resetPasswordRequest' };
  },
};
