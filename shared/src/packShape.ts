import type { Pack } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Minimal structural check for pack.json pulled out of an imported .zip:
// just enough to safely trust it as a Pack, not full business-rule validation.
export function isPackShape(value: unknown): value is Pack {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.title !== 'string') return false;
  if (typeof value.subtitle !== 'string') return false;
  if (value.status !== 'draft' && value.status !== 'ready') return false;
  if (!Array.isArray(value.rounds)) return false;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return false;

  return value.rounds.every((round) => {
    if (!isRecord(round)) return false;
    if (typeof round.id !== 'string') return false;
    if (!Array.isArray(round.prices) || round.prices.length !== 5) return false;
    if (!Array.isArray(round.categories)) return false;
    return round.categories.every((category) => {
      if (!isRecord(category)) return false;
      return typeof category.id === 'string' && typeof category.name === 'string' && Array.isArray(category.slots);
    });
  });
}
