import i18n from '$lib/i18n';
import type { User } from '$lib/types';
import { getEmailBody, replacePlaceholders, sendMail } from '.';

export async function resetPasswordRequest(email: User['email'], location: URL, id: string) {
  const route = `/auth/forgot-password/reset?token=${id}`;
  const url = new URL(route, location.origin);

  await sendMail({
    to: email,
    subject: i18n.t('transactional.emails.passwordReset.subject'),
    body: replacePlaceholders(await getEmailBody('resetPassword'), {
      email: email,
      url: url.href,
      subject: i18n.t('transactional.emails.passwordReset.subject'),
      greeting: i18n.t('transactional.emails.passwordReset.greeting'),
      body: i18n.t('transactional.emails.passwordReset.body'),
      resetLinkText: i18n.t('transactional.emails.passwordReset.resetLinkText'),
      footer: i18n.t('transactional.emails.passwordReset.footer'),
    }),
  });
}
