import type { Team } from 'shared';
import { useAnimatedNumber } from '../useAnimatedNumber';
import styles from './ScoreBoard.module.css';

interface ScoreBoardProps {
  teams: Team[];
  activeTeamId: string | null;
  scoresHidden?: boolean;
  onAdjust?: (team: Team) => void;
}

interface TeamCardProps {
  team: Team;
  active: boolean;
  scoresHidden: boolean;
  onAdjust?: (team: Team) => void;
}

function TeamCard({ team, active, scoresHidden, onAdjust }: TeamCardProps) {
  const displayScore = useAnimatedNumber(team.score);

  return (
    <div className={`${styles.card} ${active ? styles.active : ''}`}>
      <div className={styles.name}>{team.name}</div>
      <div className={styles.score}>{scoresHidden ? '???' : displayScore}</div>
      {onAdjust && (
        <button
          type="button"
          className={styles.adjustButton}
          onClick={() => onAdjust(team)}
          aria-label={`Змінити бали: ${team.name}`}
          title="Змінити бали"
        >
          ✎
        </button>
      )}
    </div>
  );
}

export function ScoreBoard({ teams, activeTeamId, scoresHidden = false, onAdjust }: ScoreBoardProps) {
  return (
    <div className={styles.board}>
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          active={team.id === activeTeamId}
          scoresHidden={scoresHidden}
          onAdjust={onAdjust}
        />
      ))}
    </div>
  );
}
