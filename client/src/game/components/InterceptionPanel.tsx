import type { InterceptionState, Team } from 'shared';
import styles from './InterceptionPanel.module.css';

interface InterceptionPanelProps {
  teams: Team[];
  interception: InterceptionState;
  selectedTeamId?: string | null;
  onAnswer: (teamId: string, correct: boolean) => void;
  onNobody: () => void;
}

export function InterceptionPanel({ teams, interception, selectedTeamId, onAnswer, onNobody }: InterceptionPanelProps) {
  const nameOf = (id: string) => teams.find((t) => t.id === id)?.name ?? id;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Перехоплення</h3>

      {interception.outcomes.map(({ teamId, correct }) => (
        <div className={styles.row} key={teamId}>
          <span className={styles.name}>{nameOf(teamId)}</span>
          <span className={styles.outcome}>{correct ? '✅' : '❌'}</span>
        </div>
      ))}

      {interception.pendingTeamIds.map((teamId, index) => (
        <div className={`${styles.row} ${teamId === selectedTeamId ? styles.rowSelected : ''}`} key={teamId}>
          {index < 8 && <span className={styles.hintKey}>{index + 1}</span>}
          <span className={styles.name}>{nameOf(teamId)}</span>
          <div className={styles.buttons}>
            <button type="button" className={styles.correctButton} onClick={() => onAnswer(teamId, true)}>
              ✅
            </button>
            <button type="button" className={styles.wrongButton} onClick={() => onAnswer(teamId, false)}>
              ❌
            </button>
          </div>
        </div>
      ))}

      {!interception.finished && (
        <button type="button" className={styles.nobodyButton} onClick={onNobody}>
          Ніхто
        </button>
      )}
    </div>
  );
}
