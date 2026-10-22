import {
  advanceQueue,
  applyScoreDelta,
  correctAnswerPoints,
  createInterception,
  createQueue,
  endInterceptionAsNobody,
  recordInterceptionAnswer,
  wrongAnswerPenalty,
  type GamePhase,
  type InterceptionState,
  type Pack,
  type QuestionResolution,
  type Question,
  type Queue,
  type Team,
} from 'shared';

export type { GamePhase, QuestionResolution };

export interface ActiveQuestion {
  categoryIndex: number;
  slotIndex: number;
  question: Question;
  price: number;
  askerTeamId: string;
  resolution: QuestionResolution;
  interception: InterceptionState | null;
  winnerTeamId: string | null;
}

export interface GameState {
  phase: GamePhase;
  pack: Pack;
  teams: Team[];
  queue: Queue;
  currentRoundIndex: number;
  playedQuestionIds: ReadonlySet<string>;
  activeQuestion: ActiveQuestion | null;
  scoresHidden: boolean;
}

export type GameAction =
  | { type: 'START' }
  | { type: 'TEAMS_READY'; teamNames: string[] }
  | { type: 'ROULETTE_DONE'; startIndex: number }
  | { type: 'OPEN_QUESTION'; categoryIndex: number; slotIndex: number }
  | { type: 'ASKER_ANSWER'; correct: boolean }
  | { type: 'CLOSE_WITHOUT_SCORING' }
  | { type: 'SKIP_TURN' }
  | { type: 'INTERCEPTION_ANSWER'; teamId: string; correct: boolean }
  | { type: 'INTERCEPTION_NOBODY' }
  | { type: 'RETURN_TO_BOARD' }
  | { type: 'NEXT_ROUND' }
  | { type: 'ROUND_INTRO_DONE' }
  | { type: 'TOGGLE_SCORES_HIDDEN' }
  | { type: 'MANUAL_SCORE_ADJUST'; teamId: string; delta: number };

export function createInitialGameState(pack: Pack): GameState {
  return {
    phase: 'teams',
    pack,
    teams: [],
    queue: { order: [], currentIndex: 0 },
    currentRoundIndex: 0,
    playedQuestionIds: new Set(),
    activeQuestion: null,
    scoresHidden: false,
  };
}

function applyDelta(teams: Team[], teamId: string, delta: number): Team[] {
  return teams.map((team) => (team.id === teamId ? { ...team, score: applyScoreDelta(team.score, delta) } : team));
}

// Challenge order for interception: the rest of the circular queue, starting
// right after the asker — the asker's own index is skipped automatically.
function otherTeamIdsInQueueOrder(queue: Queue): string[] {
  const n = queue.order.length;
  const result: string[] = [];
  for (let i = 1; i < n; i++) {
    result.push(queue.order[(queue.currentIndex + i) % n]);
  }
  return result;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return state.phase === 'intro' ? { ...state, phase: 'roulette' } : state;

    case 'TEAMS_READY': {
      const teams: Team[] = action.teamNames.map((name) => ({ id: crypto.randomUUID(), name, score: 0 }));
      return { ...state, phase: 'intro', teams };
    }

    case 'ROULETTE_DONE': {
      const queue = createQueue(state.teams.map((t) => t.id), action.startIndex);
      return { ...state, phase: 'board', queue, currentRoundIndex: 0, playedQuestionIds: new Set() };
    }

    case 'OPEN_QUESTION': {
      if (state.phase !== 'board') return state;
      const round = state.pack.rounds[state.currentRoundIndex];
      const slot = round.categories[action.categoryIndex]?.slots[action.slotIndex];
      if (!slot || state.playedQuestionIds.has(slot.id)) return state;
      return {
        ...state,
        phase: 'question',
        activeQuestion: {
          categoryIndex: action.categoryIndex,
          slotIndex: action.slotIndex,
          question: slot,
          price: round.prices[action.slotIndex],
          askerTeamId: state.queue.order[state.queue.currentIndex],
          resolution: 'pending',
          interception: null,
          winnerTeamId: null,
        },
      };
    }

    case 'ASKER_ANSWER': {
      const active = state.activeQuestion;
      if (!active || active.resolution !== 'pending') return state;

      if (action.correct) {
        const teams = applyDelta(state.teams, active.askerTeamId, correctAnswerPoints(active.price));
        return { ...state, teams, activeQuestion: { ...active, resolution: 'resolved', winnerTeamId: active.askerTeamId } };
      }

      const teams = applyDelta(state.teams, active.askerTeamId, wrongAnswerPenalty(active.price));
      const challengers = otherTeamIdsInQueueOrder(state.queue);
      const interception = createInterception(active.price, challengers);
      return {
        ...state,
        teams,
        activeQuestion: {
          ...active,
          interception,
          resolution: interception.finished ? 'resolved' : 'intercepting',
          winnerTeamId: null,
        },
      };
    }

    case 'CLOSE_WITHOUT_SCORING': {
      if (!state.activeQuestion || state.activeQuestion.resolution !== 'pending') return state;
      return { ...state, phase: 'board', activeQuestion: null };
    }

    // Passes the current team's turn to the next team in the queue without
    // scoring or closing the question — it stays open for the new asker.
    case 'SKIP_TURN': {
      const active = state.activeQuestion;
      if (!active || active.resolution !== 'pending') return state;
      const queue = advanceQueue(state.queue);
      return {
        ...state,
        queue,
        activeQuestion: { ...active, askerTeamId: queue.order[queue.currentIndex] },
      };
    }

    case 'INTERCEPTION_ANSWER': {
      const active = state.activeQuestion;
      if (!active || active.resolution !== 'intercepting' || !active.interception) return state;

      const { state: nextInterception, scoreDelta } = recordInterceptionAnswer(
        active.interception,
        action.teamId,
        action.correct,
      );
      const teams = applyDelta(state.teams, action.teamId, scoreDelta);
      return {
        ...state,
        teams,
        activeQuestion: {
          ...active,
          interception: nextInterception,
          resolution: nextInterception.finished ? 'resolved' : 'intercepting',
          winnerTeamId: nextInterception.winnerTeamId,
        },
      };
    }

    case 'INTERCEPTION_NOBODY': {
      const active = state.activeQuestion;
      if (!active || active.resolution !== 'intercepting' || !active.interception) return state;
      const nextInterception = endInterceptionAsNobody(active.interception);
      return {
        ...state,
        activeQuestion: { ...active, interception: nextInterception, resolution: 'resolved', winnerTeamId: null },
      };
    }

    case 'RETURN_TO_BOARD': {
      const active = state.activeQuestion;
      if (!active || active.resolution !== 'resolved') return state;
      const playedQuestionIds = new Set(state.playedQuestionIds);
      playedQuestionIds.add(active.question.id);
      return { ...state, phase: 'board', activeQuestion: null, playedQuestionIds, queue: advanceQueue(state.queue) };
    }

    case 'NEXT_ROUND': {
      const isLast = state.currentRoundIndex >= state.pack.rounds.length - 1;
      if (isLast) return { ...state, phase: 'final' };
      return { ...state, phase: 'round-intro', currentRoundIndex: state.currentRoundIndex + 1 };
    }

    case 'ROUND_INTRO_DONE':
      return state.phase === 'round-intro' ? { ...state, phase: 'board' } : state;

    case 'TOGGLE_SCORES_HIDDEN':
      return { ...state, scoresHidden: !state.scoresHidden };

    case 'MANUAL_SCORE_ADJUST':
      return { ...state, teams: applyDelta(state.teams, action.teamId, action.delta) };

    default:
      return state;
  }
}
