import { PasskeyDAO } from '$lib/server/db/passkey';
import { UserDAO } from '$lib/server/db/user';
import { validateTOTP } from '$lib/server/totp';
import { logger } from '$lib/utils/logger';
import { type Actions } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { ICSTokenDAO } from '$lib/server/db/ICSToken';
import type { PageServerLoad } from './$types';
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  removeTokenSchema,
  profilePictureSchema,
} from './schema';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setError, superValidate, fail, message } from 'sveltekit-superforms';

export const load = (async ({ locals }) => {
  const user = locals.user!;
  const rows = await ICSTokenDAO.getAllForUser(user.id);
  const usernameForm = await superValidate(zod4(usernameSchema), {
    defaults: { username: user.username },
  });
  const emailForm = await superValidate(zod4(emailSchema), {
    defaults: { email: user.email },
  });
  const profilePictureForm = await superValidate(zod4(profilePictureSchema));
  return { rows, usernameForm, emailForm, profilePictureForm };
}) satisfies PageServerLoad;

// TODO: make use of new sveltekit-superforms form handling
export const actions: Actions = {
  updateUsername: async (event) => {
    const { locals } = event;
    const usernameForm = await superValidate(event, zod4(usernameSchema));
    if (!usernameForm.valid) return fail(400, { usernameForm });

    const { username } = usernameForm.data;
    const user = locals.user!;

    const isUsernameTaken = await UserDAO.userExists(username);
    if (isUsernameTaken && username !== user.username)
      return setError(usernameForm, 'username', 'errors.auth.usernameTaken');
    try {
      await UserDAO.updateUser(user.id, { username });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return setError(usernameForm, 'username', msg);
    }

    return message(usernameForm, 'successes.usernameUpdated');
  },
  updateEmail: async (event) => {
    const { locals } = event;
    const emailForm = await superValidate(event, zod4(emailSchema));
    if (!emailForm.valid) return fail(400, { emailForm });

    const { email } = emailForm.data;
    const user = locals.user!;

    const isEmailTaken = await UserDAO.isEmailTaken(email);
    if (isEmailTaken && email !== user.username)
      return setError(emailForm, 'email', 'errors.auth.emailInUse');

    try {
      await UserDAO.updateUser(user.id, { email });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return setError(emailForm, 'email', msg);
    }

    return message(emailForm, 'successes.emailUpdated');
  },
  changePassword: async ({ locals, request }) => {
    const user = locals.user!;

    try {
      const formData = Object.fromEntries(await request.formData());
      const form = passwordSchema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);
      const { currentPassword, newPassword, confirmPassword } = form.data;

      if (newPassword !== confirmPassword)
        throw new Error('errors.auth.passwordReset.passwordsDontMatch');

      // Check if the password is the same as the current one
      if (!(await bcrypt.compare(currentPassword, user.passwordHash!)))
        throw new Error('errors.auth.passwordReset.wrongCurrentPassword');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      await UserDAO.updateUser(user.id, { passwordHash: hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return fail(400, { action: 'changePassword', error: true, message: msg });
    }

    return { action: 'changePassword', success: true, message: 'successes.resetPassword' };
  },
  deletePasskey: async ({ locals }) => {
    const user = locals.user!;

    try {
      await PasskeyDAO.deletePasskey(user.id);
      user.passkey = null;
      return { success: true, message: 'successes.passkeyDeleted', action: 'deletePasskey' };
    } catch (error) {
      logger.error('Error deleting passkey:', error);
      return fail(500, {
        error: true,
        message: 'errors.auth.passkeyDeletionFailed',
        action: 'deletePasskey',
      });
    }
  },
  unlinkTOTP: async ({ locals, request }) => {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const { totp } = formData as {
      totp: string;
    };
    // unlinkTOTPSchema

    try {
      if (!user.totpSecret) throw new Error('errors.auth.totp.notEnabled');
      const success = await validateTOTP(user.totpSecret, totp);
      if (!success) throw new Error('errors.auth.totp.invalidCode');
      await UserDAO.unlinkTOTP(user.id);
      return { success: true, message: 'successes.unlinkTOTP', action: 'unlinkTOTP' };
    } catch (error) {
      return fail(500, {
        action: 'unlinkTOTP',
        error: true,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
  setUpTOTP: async ({ locals, request }) => {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const { totp, TOTPsecret } = formData as {
      totp: string;
      TOTPsecret: string;
    };

    try {
      const success = await validateTOTP(TOTPsecret, totp);
      if (!success) throw new Error('errors.auth.totp.invalidCode');
      await UserDAO.setTOTPSecret(user.id, TOTPsecret);
      return { success: true, message: 'successes.setUpTOTP', action: 'setUpTOTP' };
    } catch (error) {
      return fail(500, {
        action: 'setUpTOTP',
        error: true,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  },
  updateProfilePicture: async (event) => {
    const { locals } = event;
    const profilePictureForm = await superValidate(event, zod4(profilePictureSchema));
    if (!profilePictureForm.valid) return fail(400, { profilePictureForm });

    const { profilePicture } = profilePictureForm.data;
    const user = locals.user!;
    if (profilePicture.type.split('/')[0] !== 'image')
      return setError(
        profilePictureForm,
        'profilePicture',
        'errors.account.settings.invalidProfilePicture'
      );

    try {
      const imageBuffer = Buffer.from(await profilePicture.arrayBuffer());
      await UserDAO.updateProfilePicture(user.id, imageBuffer);
    } catch (error) {
      return setError(
        profilePictureForm,
        'profilePicture',
        error instanceof Error ? error.message : String(error)
      );
    }
    return message(profilePictureForm, 'successes.profilePictureUpdated');
  },
  createToken: async ({ locals }) => {
    const user = locals.user!;

    try {
      const token = await ICSTokenDAO.createToken(user.id);
      return { success: true, message: 'successes.ics.created', action: 'createToken', token };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return fail(400, {
        action: 'createToken',
        error: true,
        message: msg || 'errors.icsToken.creationFailed',
      });
    }
  },
  revokeToken: async ({ locals, request }) => {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());

    try {
      const form = removeTokenSchema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);
      const { tokenId } = form.data;
      const userTokens = await ICSTokenDAO.getAllForUser(user.id);
      const token = userTokens.find((t) => t.id === tokenId);
      if (!token) throw new Error('errors.icsToken.notFound');
      await ICSTokenDAO.revokeToken(tokenId);
      return { success: true, message: 'successes.ics.revoked', action: 'revokeToken' };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return fail(400, {
        action: 'revokeToken',
        error: true,
        message: msg || 'errors.icsToken.revocationFailed',
      });
    }
  },
};
