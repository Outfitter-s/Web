import { PasskeyDAO } from '$lib/server/db/passkey';
import { UserDAO } from '$lib/server/db/user';
import { validateTOTP } from '$lib/server/totp';
import { logger } from '$lib/utils/logger';
import { fail, type Actions } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { defs } from '$lib/utils/form';
import z from 'zod';
import { ICSTokenDAO } from '$lib/server/db/ICSToken';
import type { PageServerLoad } from './$types';
import { UUID } from '$lib/types';

export const load = (async ({ locals }) => {
  const user = locals.user!;
  const rows = await ICSTokenDAO.getAllForUser(user.id);
  return { rows };
}) satisfies PageServerLoad;

export const actions: Actions = {
  updateUsername: async ({ locals, request }) => {
    const user = locals.user!;

    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        username: defs.username,
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);
      const { username } = form.data;
      const isUsernameTaken = await UserDAO.userExists(username);
      if (isUsernameTaken && username !== user.username)
        throw new Error('errors.auth.usernameTaken');
      await UserDAO.updateUser(user.id, { username });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return fail(400, { action: 'general', error: true, message: msg });
    }

    return { action: 'general', success: true, message: 'successes.usernameUpdated' };
  },
  updateEmail: async ({ locals, request }) => {
    const user = locals.user!;

    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        email: defs.email,
      });
      const form = schema.safeParse(formData);
      if (!form.success) throw new Error(form.error.issues[0].message);
      const { email } = form.data;
      const isEmailTaken = await UserDAO.isEmailTaken(email);
      if (isEmailTaken && email !== user.username) throw new Error('errors.auth.usernameTaken');
      await UserDAO.updateUser(user.id, { email });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(msg);
      return fail(400, { action: 'general', error: true, message: msg });
    }

    return { action: 'general', success: true, message: 'successes.emailUpdated' };
  },
  changePassword: async ({ locals, request }) => {
    const user = locals.user!;

    try {
      const formData = Object.fromEntries(await request.formData());
      const schema = z.object({
        currentPassword: defs.password,
        newPassword: defs.password,
        confirmPassword: defs.password,
      });
      const form = schema.safeParse(formData);
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
  updateProfilePicture: async ({ locals, request }) => {
    const user = locals.user!;
    const formData = Object.fromEntries(await request.formData());
    const { updateProfilePictureInput: image } = formData as {
      updateProfilePictureInput: File;
    };
    try {
      if (image.type.split('/')[0] !== 'image') {
        throw new Error('errors.account.settings.invalidProfilePicture');
      }
      const imageBuffer = Buffer.from(await image.arrayBuffer());

      await UserDAO.updateProfilePicture(user.id, imageBuffer);
      return { success: true, action: 'general', message: 'successes.profilePictureUpdated' };
    } catch (error) {
      return fail(500, {
        action: 'general',
        error: true,
        message: error instanceof Error ? error.message : String(error),
      });
    }
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
    const schema = z.object({
      tokenId: UUID,
    });

    try {
      const form = schema.safeParse(formData);
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
