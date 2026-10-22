import type { CSSProperties } from 'react';
import { rankTeams, type Team } from 'shared';
import { GameScreen } from '../components/GameScreen';
import styles from './FinalScreen.module.css';

interface FinalScreenProps {
  teams: Team[];
  onFinish: () => void;
}

export function FinalScreen({ teams, onFinish }: FinalScreenProps) {
  const ranked = rankTeams(teams);

  return (
    <GameScreen>
      <h1 className={styles.title}>Гру завершено!</h1>
      <div className={styles.table}>
        {ranked.map(({ team, rank }, index) => (
          <div
            key={team.id}
            className={`${styles.row} ${rank === 1 ? styles.rowFirst : ''}`}
            style={{ '--row-delay': `${150 + index * 120}ms` } as CSSProperties}
          >
            <span className={styles.rank}>{rank}</span>
            <span className={styles.name}>{team.name}</span>
            <span className={styles.score}>{team.score}</span>
          </div>
        ))}
      </div>
      <button type="button" className={styles.finishButton} onClick={onFinish}>
        Нова гра
      </button>
    </GameScreen>
  );
}
