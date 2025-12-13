// -----------------------------------
// --  This file is made to turn a  --
// --  regular user into an admin   --
// -----------------------------------

import pool from './pool.ts';

if (Bun.argv.length !== 3) {
  throw new Error('Usage: bun run db:make-admin <USERNAME>');
}

const username = Bun.argv[2];

await pool.query("UPDATE users SET role = 'admin' WHERE username = $1", [username]);

console.log(`Made user ${username} an admin!`);
process.exit(0);
