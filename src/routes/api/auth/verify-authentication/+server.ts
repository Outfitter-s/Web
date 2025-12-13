import { json } from '@sveltejs/kit';
import { verifyAuthenticationResponse, type WebAuthnCredential } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { Caching } from '$lib/server/db/caching';
import { PasskeyDAO } from '$lib/server/db/passkey';
import { rpID, origin } from '$lib/server/db/passkey';
import { generateAccessToken } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { authResp, UUID } = await request.json();
  try {
    const storedChallenge = await Caching.get<string>(`authenticationChallenge:${UUID}`);
    if (!storedChallenge) {
      throw new Error('errors.auth.challengeExpired');
    }

    const passkey = await PasskeyDAO.getPasskeyByCredentialID(authResp.id);
    if (!passkey) {
      throw new Error('errors.auth.noPasskey');
    }

    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge: storedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: passkey as WebAuthnCredential,
    });

    if (verification.verified) {
      const credentialId = authResp.id;
      const user = await PasskeyDAO.getUserByCredentialID(credentialId);
      await Caching.del(`authenticationChallenge:${UUID}`);
      if (!user) {
        return json({ verified: false, error: 'errors.auth.noPasskey' }, { status: 400 });
      }
      cookies.set(getCookiePrefix('token'), generateAccessToken(user.id), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      });

      return json({ verified: true, user });
    }

    return json({ verified: false, error: 'errors.auth.verificationFailed' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 400 });
  }
};
