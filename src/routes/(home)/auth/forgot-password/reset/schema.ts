import { defs } from '$lib/utils';
import { z } from 'zod';

export const formSchema = z.object({
  password: defs.password,
  confirmPassword: defs.password,
  token: z.string().min(1, { message: 'errors.auth.passwordReset.noToken' }),
});
export type FormSchema = typeof formSchema;
