import { describe, expect, it } from 'vitest';
import { isRoundComplete } from './round.js';
import type { Round } from './types.js';

function makeQuestion(id: string) {
  return {
    id,
    content: [{ id: `${id}-c`, type: 'text' as const, text: 'Питання' }],
    options: [],
    answer: [{ id: `${id}-a`, type: 'text' as const, text: 'Відповідь' }],
  };
}

const round: Round = {
  id: 'r1',
  prices: [100, 200, 300, 400, 500],
  categories: [
    {
      id: 'c1',
      name: 'Категорія 1',
      slots: [makeQuestion('q1'), null, makeQuestion('q2'), null, makeQuestion('q3')],
    },
  ],
};

describe('isRoundComplete', () => {
  it('is false while a non-empty slot is unplayed', () => {
    expect(isRoundComplete(round, new Set(['q1', 'q2']))).toBe(false);
  });

  it('ignores empty slots and is true once every question is played', () => {
    expect(isRoundComplete(round, new Set(['q1', 'q2', 'q3']))).toBe(true);
  });
});
