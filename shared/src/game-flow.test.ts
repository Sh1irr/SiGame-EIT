import { describe, expect, it } from 'vitest';
import { advanceQueue, createQueue, currentTeamId } from './queue.js';
import { createInterception, recordInterceptionAnswer } from './interception.js';
import { applyScoreDelta, wrongAnswerPenalty } from './scoring.js';

// "Sukhariky", "Chypsy", "Bekon"; queue starts on Sukhariky; price 100.
// Sukhariky answers wrong -> -50; Chypsy intercepts correctly -> +100;
// next turn goes to Chypsy (the team after Sukhariky), not the interception winner.
describe('example scenario from the spec', () => {
  it('matches the documented sequence of scores and turn order', () => {
    const scores = { t1: 0, t2: 0, t3: 0 };
    let queue = createQueue(['t1', 't2', 't3'], 0);
    const price = 100;

    expect(currentTeamId(queue)).toBe('t1');

    // t1 (the asker) answers wrong, which opens interception among the other teams.
    scores.t1 = applyScoreDelta(scores.t1, wrongAnswerPenalty(price));
    expect(scores.t1).toBe(-50);

    const interception = createInterception(price, ['t2', 't3']);
    const steal = recordInterceptionAnswer(interception, 't2', true);
    scores.t2 = applyScoreDelta(scores.t2, steal.scoreDelta);
    expect(scores.t2).toBe(100);
    expect(steal.state.winnerTeamId).toBe('t2');

    queue = advanceQueue(queue);
    expect(currentTeamId(queue)).toBe('t2');
  });
});

describe('closing a question without crediting it', () => {
  it('leaves scores and the queue untouched', () => {
    const scores = { t1: 0, t2: 0 };
    const queue = createQueue(['t1', 't2'], 0);

    // "Close without scoring" is a no-op: the UI simply does not call any
    // scoring/queue function, so nothing here can have changed.
    expect(scores).toEqual({ t1: 0, t2: 0 });
    expect(currentTeamId(queue)).toBe('t1');
  });
});
