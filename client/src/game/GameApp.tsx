import { useEffect, useReducer, useState } from 'react';
import { isRoundComplete, type GameSession, type Pack } from 'shared';
import { getPack } from '../lib/packsApi';
import { createSession, deleteSession, getActiveSession, putSession } from '../lib/sessionsApi';
import { createInitialGameState, gameReducer, type GameAction, type GameState } from './gameReducer';
import { deserializeSession, serializeSession } from './sessionCodec';
import { useGameHotkeys } from './useGameHotkeys';
import { HotkeysCheatsheet } from './components/HotkeysCheatsheet';
import { PackPickerScreen } from './screens/PackPickerScreen';
import { PackIntroScreen } from './screens/PackIntroScreen';
import { TeamsScreen } from './screens/TeamsScreen';
import { RouletteScreen } from './screens/RouletteScreen';
import { BoardScreen } from './screens/BoardScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { RoundIntroScreen } from './screens/RoundIntroScreen';
import { FinalScreen } from './screens/FinalScreen';
import { ResumePromptScreen } from './screens/ResumePromptScreen';
import styles from './GameApp.module.css';

interface GameAppProps {
  onExit: () => void;
}

type Entry =
  | { kind: 'loading' }
  | { kind: 'resume'; session: GameSession; pack: Pack }
  | { kind: 'picker' }
  | { kind: 'running'; sessionId: string; createdAt: string; initial: GameState };

export function GameApp({ onExit }: GameAppProps) {
  const [entry, setEntry] = useState<Entry>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getActiveSession();
      if (!session) {
        if (!cancelled) setEntry({ kind: 'picker' });
        return;
      }
      try {
        const pack = await getPack(session.packId);
        if (!cancelled) setEntry({ kind: 'resume', session, pack });
      } catch {
        await deleteSession(session.id).catch(() => {});
        if (!cancelled) setEntry({ kind: 'picker' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function startSessionFor(pack: Pack) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const initial = createInitialGameState(pack);
    await createSession(serializeSession(id, createdAt, initial));
    setEntry({ kind: 'running', sessionId: id, createdAt, initial });
  }

  if (entry.kind === 'loading') {
    return null;
  }

  if (entry.kind === 'resume') {
    return (
      <ResumePromptScreen
        packTitle={entry.pack.title}
        onContinue={() =>
          setEntry({
            kind: 'running',
            sessionId: entry.session.id,
            createdAt: entry.session.createdAt,
            initial: deserializeSession(entry.session, entry.pack),
          })
        }
        onNewGame={async () => {
          await deleteSession(entry.session.id).catch(() => {});
          setEntry({ kind: 'picker' });
        }}
      />
    );
  }

  if (entry.kind === 'picker') {
    return (
      <div className={styles.pickerWrap}>
        <div className={styles.homeButtonWrap}>
          <button type="button" className={styles.homeButton} onClick={onExit}>
            На головну
          </button>
        </div>
        <PackPickerScreen onSelect={startSessionFor} />
      </div>
    );
  }

  return (
    <GameRunner
      sessionId={entry.sessionId}
      createdAt={entry.createdAt}
      initial={entry.initial}
      onFinish={async () => {
        await deleteSession(entry.sessionId).catch(() => {});
        setEntry({ kind: 'picker' });
      }}
    />
  );
}

function GameRunner({
  sessionId,
  createdAt,
  initial,
  onFinish,
}: {
  sessionId: string;
  createdAt: string;
  initial: GameState;
  onFinish: () => void;
}) {
  const [state, dispatch] = useReducer(gameReducer, initial);

  useEffect(() => {
    putSession(serializeSession(sessionId, createdAt, state)).catch((err) => {
      console.error('Не вдалося зберегти стан сесії', err);
    });
  }, [state, sessionId, createdAt]);

  const { cheatsheetOpen, closeCheatsheet } = useGameHotkeys({
    onToggleScoresHidden: () => dispatch({ type: 'TOGGLE_SCORES_HIDDEN' }),
  });

  return (
    <>
      {renderScreen(state, dispatch, onFinish)}
      {cheatsheetOpen && <HotkeysCheatsheet onClose={closeCheatsheet} />}
    </>
  );
}

function renderScreen(state: GameState, dispatch: (action: GameAction) => void, onFinish: () => void) {
  switch (state.phase) {
    case 'intro':
      return <PackIntroScreen pack={state.pack} onStart={() => dispatch({ type: 'START' })} />;

    case 'teams':
      return <TeamsScreen onReady={(teamNames) => dispatch({ type: 'TEAMS_READY', teamNames })} />;

    case 'roulette':
      return (
        <RouletteScreen
          teams={state.teams}
          onDone={(startIndex) => dispatch({ type: 'ROULETTE_DONE', startIndex })}
        />
      );

    case 'board': {
      const round = state.pack.rounds[state.currentRoundIndex];
      return (
        <BoardScreen
          round={round}
          roundNumber={state.currentRoundIndex + 1}
          teams={state.teams}
          activeTeamId={state.queue.order[state.queue.currentIndex]}
          playedQuestionIds={state.playedQuestionIds}
          roundComplete={isRoundComplete(round, state.playedQuestionIds)}
          isLastRound={state.currentRoundIndex === state.pack.rounds.length - 1}
          scoresHidden={state.scoresHidden}
          onCellClick={(categoryIndex, slotIndex) => dispatch({ type: 'OPEN_QUESTION', categoryIndex, slotIndex })}
          onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
          onToggleScoresHidden={() => dispatch({ type: 'TOGGLE_SCORES_HIDDEN' })}
          onAdjustScore={(teamId, delta) => dispatch({ type: 'MANUAL_SCORE_ADJUST', teamId, delta })}
        />
      );
    }

    case 'question': {
      if (!state.activeQuestion) return null;
      const round = state.pack.rounds[state.currentRoundIndex];
      const categoryName = round.categories[state.activeQuestion.categoryIndex].name;
      return (
        <QuestionScreen
          packId={state.pack.id}
          categoryName={categoryName}
          teams={state.teams}
          activeQuestion={state.activeQuestion}
          onAskerAnswer={(correct) => dispatch({ type: 'ASKER_ANSWER', correct })}
          onCloseWithoutScoring={() => dispatch({ type: 'CLOSE_WITHOUT_SCORING' })}
          onSkipTurn={() => dispatch({ type: 'SKIP_TURN' })}
          onInterceptionAnswer={(teamId, correct) => dispatch({ type: 'INTERCEPTION_ANSWER', teamId, correct })}
          onInterceptionNobody={() => dispatch({ type: 'INTERCEPTION_NOBODY' })}
          onReturnToBoard={() => dispatch({ type: 'RETURN_TO_BOARD' })}
        />
      );
    }

    case 'round-intro': {
      const round = state.pack.rounds[state.currentRoundIndex];
      return (
        <RoundIntroScreen
          roundNumber={state.currentRoundIndex + 1}
          roundName={round.name}
          onDone={() => dispatch({ type: 'ROUND_INTRO_DONE' })}
        />
      );
    }

    case 'final':
      return <FinalScreen teams={state.teams} onFinish={onFinish} />;

    default:
      return null;
  }
}
