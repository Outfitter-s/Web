import { defs } from '$lib/utils';
import { z } from 'zod';

export const formSchema = z.object({
  email: defs.email,
  username: defs.username,
  password: defs.password,
  rememberMe: z.boolean().default(true),
});
export type FormSchema = typeof formSchema;
