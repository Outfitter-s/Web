import { json } from '@sveltejs/kit';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { UserDAO } from '$lib/server/db/user';
import { rpID, origin } from '$lib/server/db/passkey';
import { Redis } from '$lib/server/db/caching';
import { PasskeyDAO } from '$lib/server/db/passkey';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { username, attResp } = body;

  const user = await UserDAO.getUserByUsername(username);
  if (!user) {
    return json({ error: 'errors.auth.userNotFound' }, { status: 404 });
  }

  const currentChallenge = await Redis.get<string>(`registrationChallenge:${user.id}`);
  if (!currentChallenge) {
    return json({ error: 'errors.auth.challengeExpired' }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge: currentChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified && verification.registrationInfo) {
    const passkey = await PasskeyDAO.createPasskey(
      user.id,
      verification.registrationInfo.credential
    );
    await Redis.del(`registrationChallenge:${user.id}`);
    await Redis.del(`user:${user.id}`);
    return json({ verified: true, passkey });
  }

  return json({ verified: false });
};
