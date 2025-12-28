import { defs } from '$lib/utils';
import { z } from 'zod';

export const formSchema = z.object({
  email: defs.email,
});
export type FormSchema = typeof formSchema;
