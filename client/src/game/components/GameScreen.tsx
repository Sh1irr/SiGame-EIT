import type { ReactNode } from 'react';
import { Mascot } from '../../components/Mascot';
import styles from './GameScreen.module.css';

interface GameScreenProps {
  children: ReactNode;
}

// Shared full-viewport chrome (background + mascot) for the single-focus game
// screens (pack intro, teams, roulette, round intro, final). The board and
// question screens use their own full-bleed layout instead.
export function GameScreen({ children }: GameScreenProps) {
  return (
    <main className={styles.screen}>
      {children}
      <Mascot className={styles.mascot} aria-hidden />
    </main>
  );
}
