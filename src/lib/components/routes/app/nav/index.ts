import { writable } from 'svelte/store';

export const openState = writable<boolean>(false);
export const itemOpen = writable<boolean>(false);
export const outfitOpen = writable<boolean>(false);
