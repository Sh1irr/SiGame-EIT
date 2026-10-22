import { correctAnswerPoints, wrongAnswerPenalty } from './scoring.js';

export interface InterceptionOutcome {
  teamId: string;
  correct: boolean;
}

export interface InterceptionState {
  price: number;
  pendingTeamIds: string[];
  outcomes: InterceptionOutcome[];
  finished: boolean;
  winnerTeamId: string | null;
}

export function createInterception(price: number, challengerTeamIds: string[]): InterceptionState {
  return {
    price,
    pendingTeamIds: [...challengerTeamIds],
    outcomes: [],
    finished: challengerTeamIds.length === 0,
    winnerTeamId: null,
  };
}

export interface InterceptionAnswerResult {
  state: InterceptionState;
  scoreDelta: number;
}

export function recordInterceptionAnswer(
  state: InterceptionState,
  teamId: string,
  correct: boolean,
): InterceptionAnswerResult {
  if (state.finished) {
    throw new Error('Interception has already finished');
  }
  if (!state.pendingTeamIds.includes(teamId)) {
    throw new Error(`Team "${teamId}" is not eligible to answer in this interception`);
  }

  const outcomes = [...state.outcomes, { teamId, correct }];
  const pendingTeamIds = state.pendingTeamIds.filter((id) => id !== teamId);

  if (correct) {
    return {
      scoreDelta: correctAnswerPoints(state.price),
      state: { ...state, outcomes, pendingTeamIds, finished: true, winnerTeamId: teamId },
    };
  }

  // All remaining challengers answered wrong -> interception auto-ends with no winner.
  const finished = pendingTeamIds.length === 0;
  return {
    scoreDelta: wrongAnswerPenalty(state.price),
    state: { ...state, outcomes, pendingTeamIds, finished, winnerTeamId: null },
  };
}

export function endInterceptionAsNobody(state: InterceptionState): InterceptionState {
  if (state.finished) {
    throw new Error('Interception has already finished');
  }
  return { ...state, finished: true, winnerTeamId: null };
}
