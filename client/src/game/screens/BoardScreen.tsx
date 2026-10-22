import { Fragment, useState } from 'react';
import type { Round, Team } from 'shared';
import { Mascot } from '../../components/Mascot';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ManualScoreDialog } from '../components/ManualScoreDialog';
import { ScoreBoard } from '../components/ScoreBoard';
import styles from './BoardScreen.module.css';

interface BoardScreenProps {
  round: Round;
  roundNumber: number;
  teams: Team[];
  activeTeamId: string;
  playedQuestionIds: ReadonlySet<string>;
  roundComplete: boolean;
  isLastRound: boolean;
  scoresHidden: boolean;
  onCellClick: (categoryIndex: number, slotIndex: number) => void;
  onNextRound: () => void;
  onToggleScoresHidden: () => void;
  onAdjustScore: (teamId: string, delta: number) => void;
}

export function BoardScreen({
  round,
  roundNumber,
  teams,
  activeTeamId,
  playedQuestionIds,
  roundComplete,
  isLastRound,
  scoresHidden,
  onCellClick,
  onNextRound,
  onToggleScoresHidden,
  onAdjustScore,
}: BoardScreenProps) {
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <h1 className={styles.roundName}>
          {round.name || `Раунд ${roundNumber}`}
        </h1>
        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.hideScoreButton}
            onClick={onToggleScoresHidden}
            title="Приховати/показати рахунок (H)"
          >
            {scoresHidden ? '👁 Показати рахунок' : '🙈 Приховати рахунок'}
          </button>
          <button
            type="button"
            className={styles.nextRoundButton}
            onClick={() => (roundComplete ? onNextRound() : setConfirmSkip(true))}
          >
            {isLastRound ? 'До фіналу' : 'Наступний раунд'}
          </button>
        </div>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `minmax(120px, 1.3fr) repeat(${round.prices.length}, 1fr)` }}
      >
        {round.categories.map((category, categoryIndex) => (
          <Fragment key={category.id}>
            <div className={styles.categoryCell}>{category.name}</div>
            {category.slots.map((slot, slotIndex) => {
              if (!slot) {
                return (
                  <div className={`${styles.slotButton} ${styles.slotEmpty}`} key={slotIndex}>
                    —
                  </div>
                );
              }
              const played = playedQuestionIds.has(slot.id);
              return (
                <button
                  type="button"
                  key={slotIndex}
                  className={`${styles.slotButton} ${played ? styles.slotPlayed : ''}`}
                  disabled={played}
                  onClick={() => onCellClick(categoryIndex, slotIndex)}
                >
                  {round.prices[slotIndex]}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <ScoreBoard teams={teams} activeTeamId={activeTeamId} scoresHidden={scoresHidden} onAdjust={setEditingTeam} />
      <Mascot className={styles.mascot} aria-hidden />

      {confirmSkip && (
        <ConfirmDialog
          title="Перейти до наступного раунду?"
          message="У цьому раунді ще є не зіграні питання. Перейти далі без них?"
          confirmLabel="Перейти"
          danger
          onConfirm={() => {
            setConfirmSkip(false);
            onNextRound();
          }}
          onCancel={() => setConfirmSkip(false)}
        />
      )}

      {editingTeam && (
        <ManualScoreDialog
          team={editingTeam}
          onApply={(delta) => {
            onAdjustScore(editingTeam.id, delta);
            setEditingTeam(null);
          }}
          onClose={() => setEditingTeam(null)}
        />
      )}
    </main>
  );
}
