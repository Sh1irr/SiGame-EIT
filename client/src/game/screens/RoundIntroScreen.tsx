import { useEffect, useRef } from 'react';
import { GameScreen } from '../components/GameScreen';
import styles from './RoundIntroScreen.module.css';

interface RoundIntroScreenProps {
  roundNumber: number;
  roundName?: string;
  onDone: () => void;
}

const AUTO_ADVANCE_MS = 1800;

export function RoundIntroScreen({ roundNumber, roundName, onDone }: RoundIntroScreenProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDoneRef.current(), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <GameScreen>
      <button type="button" className={styles.skipButton} onClick={onDone}>
        <div className={styles.label}>Раунд {roundNumber}</div>
        {roundName && <div className={styles.name}>{roundName}</div>}
      </button>
    </GameScreen>
  );
}
