import { useEffect, useState } from 'react';
import type { Pack } from 'shared';
import { getPack, listPacks } from '../../lib/packsApi';
import { GameScreen } from '../components/GameScreen';
import styles from './PackPickerScreen.module.css';

interface PackPickerScreenProps {
  onSelect: (pack: Pack) => void;
}

export function PackPickerScreen({ onSelect }: PackPickerScreenProps) {
  const [packs, setPacks] = useState<{ id: string; title: string }[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listPacks()
      .then((all) => setPacks(all.filter((p) => p.status === 'ready').map((p) => ({ id: p.id, title: p.title }))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Не вдалося завантажити паки'));
  }, []);

  async function handleSelect(id: string) {
    try {
      onSelect(await getPack(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити пак');
    }
  }

  return (
    <GameScreen>
      <h1 className={styles.title}>Оберіть пак</h1>
      {error && <p className={styles.error}>{error}</p>}
      {packs === null ? (
        <p>Завантаження…</p>
      ) : packs.length === 0 ? (
        <p className={styles.empty}>
          Немає готових паків. Перейдіть в «Адмін», створіть пак і позначте його готовим.
        </p>
      ) : (
        <div className={styles.list}>
          {packs.map((pack) => (
            <button key={pack.id} type="button" className={styles.packButton} onClick={() => handleSelect(pack.id)}>
              {pack.title}
            </button>
          ))}
        </div>
      )}
    </GameScreen>
  );
}
