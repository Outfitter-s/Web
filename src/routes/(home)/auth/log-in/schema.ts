import { defs } from '$lib/utils';
import { z } from 'zod';

export const formSchema = z.object({
  username: defs.username,
  password: defs.password,
  rememberMe: z.boolean().default(true),
  totp: z.string().optional(),
});
export type FormSchema = typeof formSchema;
