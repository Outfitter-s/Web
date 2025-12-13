import { json } from '@sveltejs/kit';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { Caching } from '$lib/server/db/caching';
import { rpID } from '$lib/server/db/passkey';

export const GET: RequestHandler = async () => {
  const UUID = crypto.randomUUID();

  const opts = await generateAuthenticationOptions({
    rpID: rpID,
    userVerification: 'preferred',
  });
  await Caching.set(`authenticationChallenge:${UUID}`, opts.challenge, {
    ttl: 10,
  });

  return json({ opts, UUID });
};
