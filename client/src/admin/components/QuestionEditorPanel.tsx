import { useState } from 'react';
import type { AnswerOption, Question } from 'shared';
import styles from './QuestionEditorPanel.module.css';
import { MediaBlockListEditor } from './MediaBlockListEditor';

interface QuestionEditorPanelProps {
  packId: string;
  question: Question;
  onApply: (question: Question) => void;
  onClear: () => void;
  onClose: () => void;
}

const LABELS: AnswerOption['label'][] = ['A', 'B', 'C', 'D'];

function makeOption(index: number): AnswerOption {
  return { id: crypto.randomUUID(), label: LABELS[index], text: '' };
}

export function QuestionEditorPanel({ packId, question, onApply, onClear, onClose }: QuestionEditorPanelProps) {
  const [draft, setDraft] = useState<Question>(question);

  const hasOptions = draft.options.length > 0;

  function setHasOptions(value: boolean) {
    setDraft((prev) =>
      value
        ? { ...prev, options: [makeOption(0), makeOption(1)], correctOptionId: undefined }
        : { ...prev, options: [], correctOptionId: undefined },
    );
  }

  function updateOption(index: number, text: string) {
    setDraft((prev) => ({ ...prev, options: prev.options.map((o, i) => (i === index ? { ...o, text } : o)) }));
  }

  function addOption() {
    setDraft((prev) =>
      prev.options.length >= 4 ? prev : { ...prev, options: [...prev.options, makeOption(prev.options.length)] },
    );
  }

  function removeOption(index: number) {
    setDraft((prev) => {
      if (prev.options.length <= 2) return prev;
      const removed = prev.options[index];
      const options = prev.options
        .filter((_, i) => i !== index)
        .map((o, i) => ({ ...o, label: LABELS[i] }));
      return {
        ...prev,
        options,
        correctOptionId: prev.correctOptionId === removed.id ? undefined : prev.correctOptionId,
      };
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Редактор питання</h2>

        <div className={styles.block}>
          <p className={styles.blockTitle}>Контент питання</p>
          <MediaBlockListEditor
            packId={packId}
            blocks={draft.content}
            onChange={(content) => setDraft((prev) => ({ ...prev, content }))}
          />
        </div>

        <div className={styles.block}>
          <p className={styles.blockTitle}>Варіанти відповіді</p>
          <div className={styles.optionsToggle}>
            <label>
              <input type="radio" checked={!hasOptions} onChange={() => setHasOptions(false)} /> Без варіантів
            </label>
            <label>
              <input type="radio" checked={hasOptions} onChange={() => setHasOptions(true)} /> З варіантами
            </label>
          </div>

          {hasOptions && (
            <>
              {draft.options.map((option, index) => (
                <div className={styles.optionRow} key={option.id}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <input
                    type="radio"
                    name="correct-option"
                    checked={draft.correctOptionId === option.id}
                    onChange={() => setDraft((prev) => ({ ...prev, correctOptionId: option.id }))}
                    title="Правильна відповідь"
                  />
                  <input
                    type="text"
                    className={styles.optionText}
                    value={option.text}
                    placeholder={`Варіант ${option.label}`}
                    onChange={(e) => updateOption(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.smallButton}
                    disabled={draft.options.length <= 2}
                    onClick={() => removeOption(index)}
                  >
                    Видалити
                  </button>
                </div>
              ))}
              {draft.options.length < 4 && (
                <button type="button" className={styles.smallButton} onClick={addOption}>
                  + Варіант
                </button>
              )}
            </>
          )}
        </div>

        <div className={styles.block}>
          <p className={styles.blockTitle}>Правильна відповідь</p>
          <MediaBlockListEditor
            packId={packId}
            blocks={draft.answer}
            onChange={(answer) => setDraft((prev) => ({ ...prev, answer }))}
          />
        </div>

        <div className={styles.footer}>
          <button type="button" className={`${styles.button} ${styles.danger}`} onClick={onClear}>
            Очистити слот
          </button>
          <div className={styles.footerRight}>
            <button type="button" className={styles.button} onClick={onClose}>
              Скасувати
            </button>
            <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => onApply(draft)}>
              Застосувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
