import { type Role } from '$lib/types';
import { type BaseAction } from './methods';

export const actions = [
  // Please add your app actions in here (format "context:('delete'|'view'|'update'|'create')")
] as const satisfies readonly BaseAction[];

export const role_mapping: Record<Role, Action[]> = {
  admin: [
    // Add allowed actions to each of your roles in here
  ],
  user: [
    // And here also
  ],
};

export type Action = (typeof actions)[number];
export * from './methods';
