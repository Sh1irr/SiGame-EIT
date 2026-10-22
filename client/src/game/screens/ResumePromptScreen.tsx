import { GameScreen } from '../components/GameScreen';
import styles from './ResumePromptScreen.module.css';

interface ResumePromptScreenProps {
  packTitle: string;
  onContinue: () => void;
  onNewGame: () => void;
}

export function ResumePromptScreen({ packTitle, onContinue, onNewGame }: ResumePromptScreenProps) {
  return (
    <GameScreen>
      <h1 className={styles.title}>
        Продовжити гру «<span className={styles.packName}>{packTitle}</span>»?
      </h1>
      <div className={styles.actions}>
        <button type="button" className={styles.continueButton} onClick={onContinue}>
          Продовжити гру
        </button>
        <button type="button" className={styles.newGameButton} onClick={onNewGame}>
          Нова гра
        </button>
      </div>
    </GameScreen>
  );
}
