import type { ScoredClothingItem, ClothingItemColor } from '$lib/types';
import { getAnalogousColors, getComplementaryColors } from './utils';
import { NEUTRAL_COLORS } from '$lib/types';

const complexityScore: Record<string, number> = {
  solid: 0,
  striped: 0.6,
  plaid: 0.7,
  polka_dot: 0.6,
  floral: 0.8,
  graphic: 0.9,
  checked: 0.7,
};

function sameColor(a?: ClothingItemColor, b?: ClothingItemColor) {
  return !!a && !!b && a === b;
}

function isAnalogous(a?: ClothingItemColor, b?: ClothingItemColor) {
  if (!a || !b) return false;
  return getAnalogousColors(a).includes(b);
}

function isComplementary(a?: ClothingItemColor, b?: ClothingItemColor) {
  if (!a || !b) return false;
  return getComplementaryColors(a).includes(b);
}

export function patternScore(base: ScoredClothingItem, compare: ScoredClothingItem): number {
  const a = base.pattern;
  const b = compare.pattern;
  const ca = base.color as ClothingItemColor | undefined;
  const cb = compare.color as ClothingItemColor | undefined;

  if (!a || !b) return 0;

  if (a === b) {
    const bonus = sameColor(ca, cb) ? 0.25 : isAnalogous(ca, cb) ? 0.12 : 0;
    return 0.6 + bonus;
  }

  if (a === 'solid' || b === 'solid') {
    let score = 0.35;
    if (sameColor(ca, cb)) score += 0.2;
    else if (isAnalogous(ca, cb) || isComplementary(ca, cb)) score += 0.12;
    if (NEUTRAL_COLORS.includes(ca as any) || NEUTRAL_COLORS.includes(cb as any)) score += 0.08;
    return Math.min(1, score);
  }

  const complexity = Math.min(1, ((complexityScore[a] || 0.6) + (complexityScore[b] || 0.6)) / 2);

  let score = -0.3 * complexity;

  if (sameColor(ca, cb)) {
    score += 0.6;
  } else if (isAnalogous(ca, cb)) {
    score += 0.28;
  } else if (isComplementary(ca, cb)) {
    score += 0.18;
  } else if (NEUTRAL_COLORS.includes(ca as any) || NEUTRAL_COLORS.includes(cb as any)) {
    score += 0.12;
  }
  if (a === 'floral' || b === 'floral') score += 0.12;

  return Math.max(-1, Math.min(1, score));
}
