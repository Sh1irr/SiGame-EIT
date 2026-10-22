import { useEffect, useRef, useState } from 'react';
import { pickRandomStartIndex, type Team } from 'shared';
import { GameScreen } from '../components/GameScreen';
import styles from './RouletteScreen.module.css';

interface RouletteScreenProps {
  teams: Team[];
  onDone: (startIndex: number) => void;
}

const FULL_CYCLES = 3;

export function RouletteScreen({ teams, onDone }: RouletteScreenProps) {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const targetIndex = pickRandomStartIndex(teams.length);
    const totalTicks = FULL_CYCLES * teams.length + targetIndex;
    let tick = 0;
    let timeoutId: number;

    function step() {
      setHighlightIndex(tick % teams.length);
      if (tick >= totalTicks) {
        onDoneRef.current(targetIndex);
        return;
      }
      const progress = tick / totalTicks;
      const delay = 70 + progress * progress * 380;
      tick += 1;
      timeoutId = window.setTimeout(step, delay);
    }

    timeoutId = window.setTimeout(step, 70);
    return () => window.clearTimeout(timeoutId);
  }, [teams.length]);

  return (
    <GameScreen>
      <h1 className={styles.title}>Обираємо, хто починає…</h1>
      <div className={styles.list}>
        {teams.map((team, index) => (
          <div key={team.id} className={`${styles.item} ${index === highlightIndex ? styles.highlighted : ''}`}>
            {team.name}
          </div>
        ))}
      </div>
    </GameScreen>
  );
}
