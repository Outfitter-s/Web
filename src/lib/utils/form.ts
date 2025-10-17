import z from 'zod';

export const defs = {
  email: z.email('errors.auth.invalidEmail'),
  username: z
    .string()
    .min(3, 'errors.auth.usernameTooShort')
    .max(20, 'errors.auth.usernameTooLong'),
  password: z
    .string()
    .min(8, 'errors.auth.passwordTooShort')
    .max(100, 'errors.auth.passwordTooLong'),
  checkbox: z.string().transform((value) => value === 'on'),
};
