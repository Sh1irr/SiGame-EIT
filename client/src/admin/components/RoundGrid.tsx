import type { Round } from 'shared';
import styles from './RoundGrid.module.css';

interface RoundGridProps {
  round: Round;
  onChangePrice: (priceIndex: number, value: number) => void;
  onChangeCategoryName: (categoryIndex: number, name: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (categoryIndex: number) => void;
  onMoveCategory: (categoryIndex: number, direction: -1 | 1) => void;
  onCellClick: (categoryIndex: number, slotIndex: number) => void;
}

const BLOCK_ICON: Record<string, string> = { image: '🖼', audio: '🎵', video: '🎬' };

function summarizeSlot(slot: Round['categories'][number]['slots'][number]): string {
  if (slot === null) return '—';
  const first = slot.content[0];
  if (!first) return 'Питання';
  if (first.type === 'text') {
    return first.text.length > 24 ? `${first.text.slice(0, 24)}…` : first.text || 'Питання';
  }
  return `${BLOCK_ICON[first.type] ?? ''} Питання`;
}

export function RoundGrid({
  round,
  onChangePrice,
  onChangeCategoryName,
  onAddCategory,
  onRemoveCategory,
  onMoveCategory,
  onCellClick,
}: RoundGridProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Категорія \ Ціна</th>
            {round.prices.map((price, index) => (
              <th key={index}>
                <input
                  type="number"
                  className={styles.priceInput}
                  value={price}
                  min={1}
                  step={1}
                  onChange={(e) => onChangePrice(index, Number(e.target.value))}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {round.categories.map((category, categoryIndex) => (
            <tr key={category.id}>
              <td>
                <div className={styles.categoryCell}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={categoryIndex === 0}
                    onClick={() => onMoveCategory(categoryIndex, -1)}
                    aria-label="Перемістити категорію вище"
                    title="Вище"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={categoryIndex === round.categories.length - 1}
                    onClick={() => onMoveCategory(categoryIndex, 1)}
                    aria-label="Перемістити категорію нижче"
                    title="Нижче"
                  >
                    ↓
                  </button>
                  <input
                    type="text"
                    className={styles.categoryNameInput}
                    value={category.name}
                    placeholder="Назва категорії"
                    onChange={(e) => onChangeCategoryName(categoryIndex, e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.iconButton}
                    disabled={round.categories.length === 1}
                    onClick={() => onRemoveCategory(categoryIndex)}
                    aria-label="Видалити категорію"
                    title="Видалити категорію"
                  >
                    ×
                  </button>
                </div>
              </td>
              {category.slots.map((slot, slotIndex) => (
                <td key={slotIndex}>
                  <button
                    type="button"
                    className={`${styles.slot} ${slot === null ? styles.slotEmpty : styles.slotFilled}`}
                    onClick={() => onCellClick(categoryIndex, slotIndex)}
                  >
                    {summarizeSlot(slot)}
                  </button>
                </td>
              ))}
            </tr>
          ))}
          {round.categories.length < 5 && (
            <tr className={styles.addCategoryRow}>
              <td colSpan={6}>
                <button type="button" className={styles.addCategoryButton} onClick={onAddCategory}>
                  + Додати категорію
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
