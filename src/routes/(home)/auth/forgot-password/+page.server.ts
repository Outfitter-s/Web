import { UserDAO } from '$lib/server/db/user';
import { resetPasswordRequest } from '$lib/server/mail/transactional';
import type { Actions } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setError, superValidate, fail, message } from 'sveltekit-superforms';
import { formSchema } from './schema';

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(formSchema)),
  };
};

export const actions: Actions = {
  resetPassword: async (event) => {
    const { url } = event;
    const form = await superValidate(event, zod4(formSchema));
    if (!form.valid) return fail(400, { form });
    const { email } = form.data;
    let id: UUID;
    try {
      id = await UserDAO.requestPasswordReset(email);
    } catch (e) {
      return setError(form, 'email', (e as Error).message);
    }

    try {
      await resetPasswordRequest(email, url, id);
    } catch (e) {
      return fail(400, { form, message: (e as Error).message });
    }

    return message(form, 'successes.resetPasswordRequest');
  },
};
