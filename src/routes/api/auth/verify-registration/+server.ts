import { json } from '@sveltejs/kit';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { UserDAO } from '$lib/server/db/user';
import { rpID, origin } from '$lib/server/db/passkey';
import { Caching } from '$lib/server/db/caching';
import { PasskeyDAO } from '$lib/server/db/passkey';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, attResp } = body;

    const user = await UserDAO.getUserByUsername(username);

    const currentChallenge = await Caching.get<string>(`registrationChallenge:${user.id}`);
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
      await Caching.del(`registrationChallenge:${user.id}`);
      await Caching.del(`user:${user.id}`);
      return json({ verified: true, passkey });
    }

    return json({ verified: false });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 400 });
  }
};
