import type { GamePhase, GameSession, Pack } from 'shared';
import type { GameState } from './gameReducer';

export function serializeSession(sessionId: string, createdAt: string, state: GameState): GameSession {
  return {
    id: sessionId,
    packId: state.pack.id,
    status: state.phase === 'final' ? 'finished' : 'active',
    phase: state.phase,
    teams: state.teams,
    queue: state.queue,
    currentRoundIndex: state.currentRoundIndex,
    playedQuestionIds: Array.from(state.playedQuestionIds),
    scoresHidden: state.scoresHidden,
    activeQuestion: state.activeQuestion
      ? {
          categoryIndex: state.activeQuestion.categoryIndex,
          slotIndex: state.activeQuestion.slotIndex,
          price: state.activeQuestion.price,
          askerTeamId: state.activeQuestion.askerTeamId,
          resolution: state.activeQuestion.resolution,
          interception: state.activeQuestion.interception,
          winnerTeamId: state.activeQuestion.winnerTeamId,
        }
      : null,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

// Re-looks the question up in the pack rather than trusting a duplicated copy
// in the session file; falls back to the board if the pointers no longer
// resolve (e.g. a corrupted or hand-edited session file).
export function deserializeSession(session: GameSession, pack: Pack): GameState {
  const round = pack.rounds[session.currentRoundIndex];
  let activeQuestion: GameState['activeQuestion'] = null;

  if (session.activeQuestion && round) {
    const question = round.categories[session.activeQuestion.categoryIndex]?.slots[session.activeQuestion.slotIndex];
    if (question) {
      activeQuestion = {
        categoryIndex: session.activeQuestion.categoryIndex,
        slotIndex: session.activeQuestion.slotIndex,
        question,
        price: session.activeQuestion.price,
        askerTeamId: session.activeQuestion.askerTeamId,
        resolution: session.activeQuestion.resolution,
        interception: session.activeQuestion.interception,
        winnerTeamId: session.activeQuestion.winnerTeamId,
      };
    }
  }

  const phase: GamePhase = session.phase === 'question' && !activeQuestion ? 'board' : session.phase;

  return {
    phase,
    pack,
    teams: session.teams,
    queue: session.queue,
    currentRoundIndex: session.currentRoundIndex,
    playedQuestionIds: new Set(session.playedQuestionIds),
    activeQuestion,
    scoresHidden: session.scoresHidden,
  };
}
