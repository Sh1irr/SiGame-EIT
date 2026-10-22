import { describe, expect, it } from 'vitest';
import { isGameSessionShape, type GameSession } from './session.js';

const validSession: GameSession = {
  id: 's1',
  packId: 'p1',
  status: 'active',
  phase: 'board',
  teams: [{ id: 't1', name: 'Сухарики', score: 0 }],
  queue: { order: ['t1'], currentIndex: 0 },
  currentRoundIndex: 0,
  playedQuestionIds: ['q1'],
  scoresHidden: false,
  activeQuestion: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('isGameSessionShape', () => {
  it('accepts a well-formed session', () => {
    expect(isGameSessionShape(validSession)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isGameSessionShape(null)).toBe(false);
    expect(isGameSessionShape('session')).toBe(false);
    expect(isGameSessionShape([])).toBe(false);
  });

  it('rejects an invalid status', () => {
    expect(isGameSessionShape({ ...validSession, status: 'done' })).toBe(false);
  });

  it('rejects a malformed queue', () => {
    expect(isGameSessionShape({ ...validSession, queue: { order: ['t1'] } })).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(isGameSessionShape({ ...validSession, packId: undefined })).toBe(false);
  });
});
