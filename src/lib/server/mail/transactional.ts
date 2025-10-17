import type { User } from '$lib/types';
import { getEmailBody, replacePlaceholders, sendMail } from '.';

export async function resetPasswordRequest(email: User['email'], location: URL, id: string) {
  const route = `/auth/forgot-password/reset?token=${id}`;
  const url = new URL(route, location.origin);

  await sendMail({
    to: email,
    subject: 'Reset your password',
    body: replacePlaceholders(await getEmailBody('resetPassword'), {
      email: email,
      url: url.href,
    }),
  });
}
