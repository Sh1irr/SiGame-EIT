import { useState } from 'react';
import styles from './App.module.css';
import { Mascot } from './components/Mascot';
import { useFullscreen } from './hooks/useFullscreen';
import { useTheme } from './hooks/useTheme';
import { AdminApp } from './admin/AdminApp';
import { GameApp } from './game/GameApp';

type Screen = 'home' | 'admin' | 'game';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'admin') {
    return <AdminApp onExit={() => setScreen('home')} />;
  }
  if (screen === 'game') {
    return <GameApp onExit={() => setScreen('home')} />;
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label="Перемкнути тему"
          title="Перемкнути тему"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={toggleFullscreen}
          aria-label="Повноекранний режим"
          title="Повноекранний режим"
        >
          {isFullscreen ? '⤡' : '⤢'}
        </button>
      </div>

      <Mascot className={styles.mascot} />
      <h1 className={styles.title}>Своя гра</h1>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={() => setScreen('game')}>
          Гра
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
          onClick={() => setScreen('admin')}
        >
          Адмін
        </button>
      </div>
    </main>
  );
}

export default App;
