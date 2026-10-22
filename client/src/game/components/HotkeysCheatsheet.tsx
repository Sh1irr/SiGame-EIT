import styles from './HotkeysCheatsheet.module.css';
import { useEscapeToClose } from '../dialogStack';

interface HotkeysCheatsheetProps {
  onClose: () => void;
}

const ROWS: Array<[string, string]> = [
  ['F', 'Повноекранний режим'],
  ['H', 'Приховати/показати рахунок'],
  ['T', 'Перемкнути тему'],
  ['Space', '▶/⏸ поточного медіа'],
  ['Esc', 'Закрити діалог'],
  ['1–8', 'Підказка команди при перехопленні'],
  ['?', 'Ця шпаргалка'],
];

export function HotkeysCheatsheet({ onClose }: HotkeysCheatsheetProps) {
  useEscapeToClose(onClose);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Гарячі клавіші</h3>
        <div className={styles.list}>
          {ROWS.map(([key, desc]) => (
            <div className={styles.row} key={key}>
              <span className={styles.key}>{key}</span>
              <span className={styles.desc}>{desc}</span>
            </div>
          ))}
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          Закрити
        </button>
      </div>
    </div>
  );
}
