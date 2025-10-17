import { env } from '$env/dynamic/private';

export const getEnv = (key: string, defaultValue: string) => {
  return env[key] || defaultValue;
};
