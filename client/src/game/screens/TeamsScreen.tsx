import { useState } from 'react';
import { GameScreen } from '../components/GameScreen';
import styles from './TeamsScreen.module.css';

interface TeamsScreenProps {
  onReady: (names: string[]) => void;
}

const MAX_NAME_LENGTH = 30;
const MIN_TEAMS = 2;
const MAX_TEAMS = 8;

export function TeamsScreen({ onReady }: TeamsScreenProps) {
  const [names, setNames] = useState<string[]>(['', '']);

  function setName(index: number, value: string) {
    setNames((prev) => prev.map((n, i) => (i === index ? value.slice(0, MAX_NAME_LENGTH) : n)));
  }

  function addTeam() {
    setNames((prev) => (prev.length >= MAX_TEAMS ? prev : [...prev, '']));
  }

  function removeTeam(index: number) {
    setNames((prev) => (prev.length <= MIN_TEAMS ? prev : prev.filter((_, i) => i !== index)));
  }

  function moveTeam(index: number, direction: -1 | 1) {
    setNames((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const trimmed = names.map((n) => n.trim());
  const hasEmpty = trimmed.some((n) => n.length === 0);
  const hasDuplicates = new Set(trimmed).size !== trimmed.length;
  const canStart = !hasEmpty && !hasDuplicates && trimmed.length >= MIN_TEAMS;

  return (
    <GameScreen>
      <h1 className={styles.title}>Команди</h1>
      <div className={styles.list}>
        {names.map((name, index) => (
          <div className={styles.row} key={index}>
            <button
              type="button"
              className={styles.iconButton}
              disabled={index === 0}
              onClick={() => moveTeam(index, -1)}
              title="Вище"
            >
              ↑
            </button>
            <button
              type="button"
              className={styles.iconButton}
              disabled={index === names.length - 1}
              onClick={() => moveTeam(index, 1)}
              title="Нижче"
            >
              ↓
            </button>
            <input
              type="text"
              className={styles.input}
              value={name}
              placeholder={`Команда ${index + 1}`}
              onChange={(e) => setName(index, e.target.value)}
            />
            <button
              type="button"
              className={styles.iconButton}
              disabled={names.length <= MIN_TEAMS}
              onClick={() => removeTeam(index)}
              title="Видалити команду"
            >
              ×
            </button>
          </div>
        ))}
        {names.length < MAX_TEAMS && (
          <button type="button" className={styles.addButton} onClick={addTeam}>
            + Додати команду
          </button>
        )}
      </div>

      {hasEmpty && <p className={styles.error}>Усі назви команд мають бути заповнені.</p>}
      {!hasEmpty && hasDuplicates && <p className={styles.error}>Назви команд мають бути унікальними.</p>}

      <button type="button" className={styles.startButton} disabled={!canStart} onClick={() => onReady(trimmed)}>
        Продовжити
      </button>
    </GameScreen>
  );
}
