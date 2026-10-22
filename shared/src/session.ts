import type { InterceptionState } from './interception.js';
import type { Queue } from './queue.js';
import type { Team } from './ranking.js';

export type GamePhase = 'intro' | 'teams' | 'roulette' | 'board' | 'question' | 'round-intro' | 'final';

export type QuestionResolution = 'pending' | 'intercepting' | 'resolved';

// Pointers only (not the full Question) — the client re-looks the question up
// in the pack on resume, so the session file never duplicates pack content.
export interface PersistedActiveQuestion {
  categoryIndex: number;
  slotIndex: number;
  price: number;
  askerTeamId: string;
  resolution: QuestionResolution;
  interception: InterceptionState | null;
  winnerTeamId: string | null;
}

export interface GameSession {
  id: string;
  packId: string;
  status: 'active' | 'finished';
  phase: GamePhase;
  teams: Team[];
  queue: Queue;
  currentRoundIndex: number;
  playedQuestionIds: string[];
  scoresHidden: boolean;
  activeQuestion: PersistedActiveQuestion | null;
  createdAt: string;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Minimal structural check for a session file read back from disk — enough to
// safely trust it, not a full business-rule validation (sessions have none).
export function isGameSessionShape(value: unknown): value is GameSession {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.packId !== 'string') return false;
  if (value.status !== 'active' && value.status !== 'finished') return false;
  if (typeof value.phase !== 'string') return false;
  if (!Array.isArray(value.teams) || !Array.isArray(value.playedQuestionIds)) return false;
  if (typeof value.currentRoundIndex !== 'number') return false;
  if (typeof value.scoresHidden !== 'boolean') return false;
  if (!isRecord(value.queue) || !Array.isArray(value.queue.order) || typeof value.queue.currentIndex !== 'number') {
    return false;
  }
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return false;
  return true;
}
