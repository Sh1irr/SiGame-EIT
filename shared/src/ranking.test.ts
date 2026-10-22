import { describe, expect, it } from 'vitest';
import { rankTeams, type Team } from './ranking.js';

describe('rankTeams', () => {
  it('ranks teams by descending score', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Сухарики', score: 100 },
      { id: 't2', name: 'Чипси', score: 300 },
      { id: 't3', name: 'Бекон', score: 200 },
    ];

    const ranked = rankTeams(teams);

    expect(ranked.map((r) => r.team.id)).toEqual(['t2', 't3', 't1']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('gives tied scores a shared place and skips the next rank', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Сухарики', score: 100 },
      { id: 't2', name: 'Чипси', score: 100 },
      { id: 't3', name: 'Бекон', score: 50 },
    ];

    const ranked = rankTeams(teams);

    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it('handles negative scores', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Сухарики', score: -50 },
      { id: 't2', name: 'Чипси', score: 0 },
    ];

    const ranked = rankTeams(teams);

    expect(ranked.map((r) => r.team.id)).toEqual(['t2', 't1']);
  });
});
