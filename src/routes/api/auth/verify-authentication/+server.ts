import { json } from '@sveltejs/kit';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { Redis } from '$lib/server/db/caching';
import { PasskeyDAO } from '$lib/server/db/passkey';
import { rpID, origin } from '$lib/server/db/passkey';
import { generateAccessToken } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { authResp, UUID } = await request.json();

  const storedChallenge = await Redis.get<string>(`authenticationChallenge:${UUID}`);
  if (!storedChallenge) {
    return json({ error: 'errors.auth.challengeExpired' }, { status: 400 });
  }

  const passkey = await PasskeyDAO.getPasskeyByCredentialID(authResp.id);
  if (!passkey) {
    throw new Error('No authenticator found for this credential ID');
  }

  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge: storedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: passkey,
  });

  if (verification.verified) {
    const credentialId = authResp.id;
    const user = await PasskeyDAO.getUserByCredentialID(credentialId);
    await Redis.del(`authenticationChallenge:${UUID}`);
    if (!user) {
      return json({ verified: false, error: 'errors.auth.noPasskey' }, { status: 400 });
    }
    cookies.set('token', generateAccessToken(user.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });

    return json({ verified: true, user });
  }

  return json({ verified: false, error: 'errors.auth.verificationFailed' }, { status: 400 });
};
