export interface Team {
  id: string;
  name: string;
  score: number;
}

export interface RankedTeam {
  team: Team;
  rank: number;
}

// Standard competition ranking: tied scores share a place, next rank skips ahead (1, 1, 3).
export function rankTeams(teams: Team[]): RankedTeam[] {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  let rank = 0;
  let previousScore: number | null = null;

  return sorted.map((team, index) => {
    if (previousScore === null || team.score !== previousScore) {
      rank = index + 1;
      previousScore = team.score;
    }
    return { team, rank };
  });
}
