import { useState } from 'react';
import type { Team } from 'shared';
import styles from './ManualScoreDialog.module.css';
import { useEscapeToClose } from '../dialogStack';

interface ManualScoreDialogProps {
  team: Team;
  onApply: (delta: number) => void;
  onClose: () => void;
}

export function ManualScoreDialog({ team, onApply, onClose }: ManualScoreDialogProps) {
  const [sign, setSign] = useState<1 | -1>(1);
  const [amount, setAmount] = useState('');
  useEscapeToClose(onClose);

  const magnitude = Math.max(0, Math.floor(Number(amount) || 0));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Змінити бали: {team.name}</h3>
        <p className={styles.current}>Поточний рахунок: {team.score}</p>

        <div className={styles.row}>
          <button
            type="button"
            className={`${styles.signButton} ${sign === 1 ? styles.signActive : ''}`}
            onClick={() => setSign(1)}
          >
            +
          </button>
          <button
            type="button"
            className={`${styles.signButton} ${sign === -1 ? styles.signActive : ''}`}
            onClick={() => setSign(-1)}
          >
            −
          </button>
          <input
            type="number"
            className={styles.amountInput}
            min={0}
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onClose}>
            Скасувати
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            disabled={magnitude === 0}
            onClick={() => onApply(sign * magnitude)}
          >
            Застосувати
          </button>
        </div>
      </div>
    </div>
  );
}
