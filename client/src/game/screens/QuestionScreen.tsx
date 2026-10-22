import { useEffect, useState } from 'react';
import type { ActiveQuestion } from '../gameReducer';
import type { Team } from 'shared';
import { Mascot } from '../../components/Mascot';
import { MediaBlockView } from '../components/MediaBlockView';
import { InterceptionPanel } from '../components/InterceptionPanel';
import styles from './QuestionScreen.module.css';

interface QuestionScreenProps {
  packId: string;
  categoryName: string;
  teams: Team[];
  activeQuestion: ActiveQuestion;
  onAskerAnswer: (correct: boolean) => void;
  onCloseWithoutScoring: () => void;
  onSkipTurn: () => void;
  onInterceptionAnswer: (teamId: string, correct: boolean) => void;
  onInterceptionNobody: () => void;
  onReturnToBoard: () => void;
}

export function QuestionScreen({
  packId,
  categoryName,
  teams,
  activeQuestion,
  onAskerAnswer,
  onCloseWithoutScoring,
  onSkipTurn,
  onInterceptionAnswer,
  onInterceptionNobody,
  onReturnToBoard,
}: QuestionScreenProps) {
  const { question, price, askerTeamId, resolution, interception, winnerTeamId } = activeQuestion;
  const askerName = teams.find((t) => t.id === askerTeamId)?.name ?? '';
  const showingAnswer = resolution === 'resolved';
  const blocks = showingAnswer ? question.answer : question.content;
  const mascotMood = showingAnswer ? 'neutral' : 'question';

  const [selectedChallengerId, setSelectedChallengerId] = useState<string | null>(null);

  useEffect(() => {
    if (resolution !== 'intercepting' || !interception) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.tagName === 'INPUT') return;
      const digit = Number(event.key);
      if (!Number.isInteger(digit) || digit < 1 || digit > 8) return;
      const teamId = interception?.pendingTeamIds[digit - 1];
      if (teamId) setSelectedChallengerId(teamId);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resolution, interception]);

  return (
    <main className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.category}>{categoryName}</span>
        <span className={styles.price}>{price}</span>
        <span className={styles.team}>Відповідає: {askerName}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.blockGap}>
          {blocks.map((block) => (
            <MediaBlockView key={block.id} packId={packId} block={block} />
          ))}
        </div>

        {question.options.length > 0 && (
          <div className={styles.options}>
            {question.options.map((option) => (
              <div
                key={option.id}
                className={`${styles.option} ${showingAnswer && option.id === question.correctOptionId ? styles.optionCorrect : ''}`}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {option.text}
              </div>
            ))}
          </div>
        )}

        {resolution === 'intercepting' && interception && (
          <InterceptionPanel
            teams={teams}
            interception={interception}
            selectedTeamId={selectedChallengerId}
            onAnswer={onInterceptionAnswer}
            onNobody={onInterceptionNobody}
          />
        )}

        {showingAnswer && (
          <p className={styles.resultNote}>
            {winnerTeamId
              ? `Зараховано команді «${teams.find((t) => t.id === winnerTeamId)?.name ?? ''}»`
              : 'Ніхто не відповів правильно'}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {resolution === 'pending' && (
          <>
            <button type="button" className={styles.correctButton} onClick={() => onAskerAnswer(true)}>
              ✅ Правильно
            </button>
            <button type="button" className={styles.wrongButton} onClick={() => onAskerAnswer(false)}>
              ❌ Неправильно
            </button>
            <button type="button" className={styles.closeButton} onClick={onCloseWithoutScoring}>
              Закрити без нарахування
            </button>
            <button type="button" className={styles.closeButton} onClick={onSkipTurn}>
              Пропустити хід
            </button>
          </>
        )}
        {showingAnswer && (
          <button type="button" className={styles.nextButton} onClick={onReturnToBoard}>
            До поля
          </button>
        )}
      </div>

      <Mascot mood={mascotMood} className={styles.mascot} aria-hidden />
    </main>
  );
}
