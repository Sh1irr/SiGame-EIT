import type { Round } from './types.js';

export function isRoundComplete(round: Round, playedQuestionIds: ReadonlySet<string>): boolean {
  for (const category of round.categories) {
    for (const slot of category.slots) {
      if (slot !== null && !playedQuestionIds.has(slot.id)) {
        return false;
      }
    }
  }
  return true;
}
