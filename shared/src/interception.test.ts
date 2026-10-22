import { describe, expect, it } from 'vitest';
import { createInterception, endInterceptionAsNobody, recordInterceptionAnswer } from './interception.js';

describe('interception', () => {
  it('awards the full price to the first team that answers correctly', () => {
    const start = createInterception(100, ['t2', 't3']);
    const { state, scoreDelta } = recordInterceptionAnswer(start, 't2', true);

    expect(scoreDelta).toBe(100);
    expect(state.finished).toBe(true);
    expect(state.winnerTeamId).toBe('t2');
  });

  it('penalises each wrong challenger before someone gets it right', () => {
    const start = createInterception(100, ['t2', 't3']);
    const afterT2 = recordInterceptionAnswer(start, 't2', false);
    expect(afterT2.scoreDelta).toBe(-50);
    expect(afterT2.state.finished).toBe(false);

    const afterT3 = recordInterceptionAnswer(afterT2.state, 't3', true);
    expect(afterT3.scoreDelta).toBe(100);
    expect(afterT3.state.finished).toBe(true);
    expect(afterT3.state.winnerTeamId).toBe('t3');
  });

  it('auto-finishes with no winner once every challenger has answered wrong', () => {
    const start = createInterception(100, ['t2', 't3']);
    const afterT2 = recordInterceptionAnswer(start, 't2', false);
    const afterT3 = recordInterceptionAnswer(afterT2.state, 't3', false);

    expect(afterT3.scoreDelta).toBe(-50);
    expect(afterT3.state.finished).toBe(true);
    expect(afterT3.state.winnerTeamId).toBeNull();
  });

  it('"Nobody" ends the interception without crediting anyone further', () => {
    const start = createInterception(100, ['t2', 't3']);
    const afterT2 = recordInterceptionAnswer(start, 't2', false);
    const ended = endInterceptionAsNobody(afterT2.state);

    expect(ended.finished).toBe(true);
    expect(ended.winnerTeamId).toBeNull();
    expect(ended.pendingTeamIds).toEqual(['t3']);
  });

  it('starts already finished when there is no one left to challenge', () => {
    const state = createInterception(100, []);
    expect(state.finished).toBe(true);
  });

  it('rejects answers once finished', () => {
    const start = createInterception(100, ['t2']);
    const { state } = recordInterceptionAnswer(start, 't2', true);
    expect(() => recordInterceptionAnswer(state, 't2', false)).toThrow();
  });
});
