import { UserDAO } from '$lib/server/db/user';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rpID, rpName } from '$lib/server/db/passkey';
import { Caching } from '$lib/server/db/caching';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const username = url.searchParams.get('username') ?? '';
    const user = await UserDAO.getUserByUsername(username);

    const excludeCredentials = user.passkey
      ? [
          {
            id: user.passkey.id,
            // Optional: specify transports if known
            transports: user.passkey.transports,
          },
        ]
      : undefined;

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: 'none',
      // Prevent users from re-registering existing authenticators
      excludeCredentials: excludeCredentials,
      // See "Guiding use of authenticators via authenticatorSelection" below
      authenticatorSelection: {
        // Defaults
        residentKey: 'preferred',
        userVerification: 'preferred',
        // Optional
        authenticatorAttachment: 'platform',
      },
      userID: new TextEncoder().encode(user.id),
    });

    await Caching.set(`registrationChallenge:${user.id}`, options.challenge, {
      ttl: 10,
    });

    return json(options);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return json({ error: msg }, { status: 400 });
  }
};
