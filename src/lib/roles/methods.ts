import { roles, type Role } from '$lib/types';
import { role_mapping, type Action } from '.';

export const methods = ['delete', 'view', 'update', 'create'] as const;
export type Method = (typeof methods)[number];
export type BaseAction = `${string}:${Method}`;

export function isRoleAbove(role: Role, targetRole: Role, strict = false) {
  const idx = roles.indexOf(role);
  const targetIdx = roles.indexOf(targetRole);
  return strict ? idx > targetIdx : idx >= targetIdx;
}

export function canDo(role: Role, ...actions: Action[]) {
  return role_mapping[role].some((i) => actions.includes(i));
}
