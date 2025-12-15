export function match(value) {
  // Matches an `@` sign followed by a username (3-30 alphanumeric characters or underscores)
  return /^@([a-zA-Z0-9_]{3,30})$/.test(value);
}
