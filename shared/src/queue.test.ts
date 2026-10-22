import { describe, expect, it } from 'vitest';
import { advanceQueue, createQueue, currentTeamId, pickRandomStartIndex } from './queue.js';

describe('advanceQueue', () => {
  it('moves strictly to the next team in turn order', () => {
    const queue = createQueue(['t1', 't2', 't3'], 0);
    const next = advanceQueue(queue);
    expect(currentTeamId(next)).toBe('t2');
  });

  it('wraps around from the last team back to the first', () => {
    const queue = createQueue(['t1', 't2', 't3'], 2);
    const next = advanceQueue(queue);
    expect(currentTeamId(next)).toBe('t1');
  });
});

describe('pickRandomStartIndex', () => {
  it('maps 0 to the first team', () => {
    expect(pickRandomStartIndex(3, () => 0)).toBe(0);
  });

  it('maps a value just below 1 to the last team', () => {
    expect(pickRandomStartIndex(3, () => 0.999)).toBe(2);
  });
});
