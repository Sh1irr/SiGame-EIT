import { useEffect, useMemo, useState } from 'react';
import type { Category, Pack, Question, Round, ValidationError } from 'shared';
import styles from './PackEditorScreen.module.css';
import { ConfirmDialog } from './components/ConfirmDialog';
import { RoundGrid } from './components/RoundGrid';
import { QuestionEditorPanel } from './components/QuestionEditorPanel';
import { getPack, mediaUrl, savePack, uploadMedia } from './api';
import { getActiveSession } from '../lib/sessionsApi';

interface PackEditorScreenProps {
  packId: string;
  onBack: () => void;
}

interface EditingSlot {
  roundIndex: number;
  categoryIndex: number;
  slotIndex: number;
}

function defaultPrices(roundNumber: number): [number, number, number, number, number] {
  const prices = [1, 2, 3, 4, 5].map((i) => i * 100 * roundNumber);
  return prices as [number, number, number, number, number];
}

function makeEmptyCategory(): Category {
  return { id: crypto.randomUUID(), name: '', slots: [null, null, null, null, null] };
}

function makeBlankQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    content: [{ id: crypto.randomUUID(), type: 'text', text: '' }],
    options: [],
    answer: [{ id: crypto.randomUUID(), type: 'text', text: '' }],
  };
}

export function PackEditorScreen({ packId, onBack }: PackEditorScreenProps) {
  const [pack, setPack] = useState<Pack | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [editingSlot, setEditingSlot] = useState<EditingSlot | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    getActiveSession().then((session) => {
      setHasActiveSession(session?.packId === packId);
    });
  }, [packId]);

  useEffect(() => {
    let cancelled = false;
    getPack(packId)
      .then((loaded) => {
        if (cancelled) return;
        setPack(loaded);
        setSavedSnapshot(JSON.stringify(loaded));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Не вдалося завантажити пак');
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  const dirty = useMemo(() => pack !== null && JSON.stringify(pack) !== savedSnapshot, [pack, savedSnapshot]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function update(updater: (pack: Pack) => Pack) {
    setPack((prev) => (prev ? updater(prev) : prev));
  }

  function handleBack() {
    if (dirty) {
      setConfirmExit(true);
    } else {
      onBack();
    }
  }

  async function handleSave(markReady: boolean) {
    if (!pack) return;
    setSaving(true);
    setError('');
    try {
      const toSave: Pack = markReady ? { ...pack, status: 'ready' } : pack;
      const result = await savePack(toSave);
      setPack(result.pack);
      setSavedSnapshot(JSON.stringify(result.pack));
      setValidationErrors(result.validationErrors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти пак');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!pack) return;
    setLogoUploading(true);
    setError('');
    try {
      const uploaded = await uploadMedia(pack.id, file);
      update((p) => ({ ...p, logo: uploaded }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити логотип');
    } finally {
      setLogoUploading(false);
    }
  }

  function addRound() {
    update((p) => {
      const roundNumber = p.rounds.length + 1;
      const round: Round = {
        id: crypto.randomUUID(),
        name: `Раунд ${roundNumber}`,
        prices: defaultPrices(roundNumber),
        categories: [makeEmptyCategory()],
      };
      return { ...p, rounds: [...p.rounds, round] };
    });
    setActiveRoundIndex((pack?.rounds.length ?? 0));
  }

  function removeRound(index: number) {
    update((p) => ({ ...p, rounds: p.rounds.filter((_, i) => i !== index) }));
    setActiveRoundIndex((prevIndex) => Math.max(0, Math.min(prevIndex, (pack?.rounds.length ?? 1) - 2)));
  }

  function moveRound(index: number, direction: -1 | 1) {
    update((p) => {
      const rounds = [...p.rounds];
      const target = index + direction;
      if (target < 0 || target >= rounds.length) return p;
      [rounds[index], rounds[target]] = [rounds[target], rounds[index]];
      return { ...p, rounds };
    });
    setActiveRoundIndex((prev) => {
      const target = prev + direction;
      return target < 0 || target >= (pack?.rounds.length ?? 0) ? prev : target;
    });
  }

  function updateRound(index: number, updater: (round: Round) => Round) {
    update((p) => ({
      ...p,
      rounds: p.rounds.map((round, i) => (i === index ? updater(round) : round)),
    }));
  }

  function jumpToError(err: ValidationError) {
    if (err.roundIndex !== undefined) {
      setActiveRoundIndex(err.roundIndex);
      if (err.categoryIndex !== undefined && err.slotIndex !== undefined) {
        setEditingSlot({ roundIndex: err.roundIndex, categoryIndex: err.categoryIndex, slotIndex: err.slotIndex });
      }
    }
  }

  if (loadError) {
    return <p className={styles.errorBanner}>{loadError}</p>;
  }
  if (!pack) {
    return <p>Завантаження…</p>;
  }

  const activeRound: Round | undefined = pack.rounds[activeRoundIndex];
  const editingQuestion = editingSlot
    ? pack.rounds[editingSlot.roundIndex]?.categories[editingSlot.categoryIndex]?.slots[editingSlot.slotIndex] ??
      makeBlankQuestion()
    : null;

  return (
    <div>
      <div className={styles.topBar}>
        <button type="button" className={styles.backButton} onClick={handleBack}>
          ← До списку паків
        </button>
        <div className={styles.saveBar}>
          {dirty && <span className={styles.dirtyNotice}>Є незбережені зміни</span>}
          <button type="button" className={styles.secondaryButton} disabled={saving} onClick={() => handleSave(false)}>
            Зберегти
          </button>
          <button type="button" className={styles.primaryButton} disabled={saving} onClick={() => handleSave(true)}>
            Позначити готовим
          </button>
        </div>
      </div>

      {hasActiveSession && (
        <p className={styles.warningBanner}>
          За цим паком зараз іде незавершена гра. Зміни можуть вплинути на поточну партію.
        </p>
      )}

      {error && <p className={styles.errorBanner}>{error}</p>}

      {validationErrors.length > 0 && (
        <div className={styles.errorBanner}>
          <strong>Пак не готовий — {validationErrors.length} помилка(ок):</strong>
          <ul className={styles.errorList}>
            {validationErrors.map((err, i) => (
              <li key={i}>
                <button type="button" className={styles.errorLink} onClick={() => jumpToError(err)}>
                  {err.message}
                  {err.roundIndex !== undefined ? ` (раунд ${err.roundIndex + 1})` : ''}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Метадані</h2>
        <div className={styles.metadataGrid}>
          <label className={styles.field}>
            Назва
            <input
              type="text"
              value={pack.title}
              onChange={(e) => update((p) => ({ ...p, title: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            Підзаголовок
            <input
              type="text"
              value={pack.subtitle}
              onChange={(e) => update((p) => ({ ...p, subtitle: e.target.value }))}
            />
          </label>
          <div className={styles.field}>
            Логотип
            <div className={styles.logoPreviewRow}>
              <img
                className={styles.logoPreview}
                src={pack.logo ? mediaUrl(pack.id, pack.logo) : '/brand/logo-black.png'}
                alt=""
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={logoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleLogoUpload(file);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Раунди</h2>
        <div className={styles.roundTabs}>
          {pack.rounds.map((round, index) => (
            <button
              key={round.id}
              type="button"
              className={`${styles.roundTab} ${index === activeRoundIndex ? styles.roundTabActive : ''}`}
              onClick={() => setActiveRoundIndex(index)}
            >
              {round.name || `Раунд ${index + 1}`}
            </button>
          ))}
          <button type="button" className={styles.roundTabAdd} onClick={addRound}>
            + Раунд
          </button>
        </div>

        {activeRound && (
          <>
            <div className={styles.roundControls}>
              <input
                type="text"
                className={styles.roundNameInput}
                value={activeRound.name ?? ''}
                placeholder={`Раунд ${activeRoundIndex + 1}`}
                onChange={(e) => updateRound(activeRoundIndex, (r) => ({ ...r, name: e.target.value }))}
              />
              <button
                type="button"
                className={styles.iconButton}
                disabled={activeRoundIndex === 0}
                onClick={() => moveRound(activeRoundIndex, -1)}
                title="Перемістити раунд ліворуч"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.iconButton}
                disabled={activeRoundIndex === pack.rounds.length - 1}
                onClick={() => moveRound(activeRoundIndex, 1)}
                title="Перемістити раунд праворуч"
              >
                →
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => removeRound(activeRoundIndex)}
                title="Видалити раунд"
              >
                🗑
              </button>
            </div>

            <RoundGrid
              round={activeRound}
              onChangePrice={(priceIndex, value) =>
                updateRound(activeRoundIndex, (r) => {
                  const prices = [...r.prices] as Round['prices'];
                  prices[priceIndex] = value;
                  return { ...r, prices };
                })
              }
              onChangeCategoryName={(categoryIndex, name) =>
                updateRound(activeRoundIndex, (r) => ({
                  ...r,
                  categories: r.categories.map((c, i) => (i === categoryIndex ? { ...c, name } : c)),
                }))
              }
              onAddCategory={() =>
                updateRound(activeRoundIndex, (r) => ({ ...r, categories: [...r.categories, makeEmptyCategory()] }))
              }
              onRemoveCategory={(categoryIndex) =>
                updateRound(activeRoundIndex, (r) => ({
                  ...r,
                  categories: r.categories.filter((_, i) => i !== categoryIndex),
                }))
              }
              onMoveCategory={(categoryIndex, direction) =>
                updateRound(activeRoundIndex, (r) => {
                  const categories = [...r.categories];
                  const target = categoryIndex + direction;
                  if (target < 0 || target >= categories.length) return r;
                  [categories[categoryIndex], categories[target]] = [categories[target], categories[categoryIndex]];
                  return { ...r, categories };
                })
              }
              onCellClick={(categoryIndex, slotIndex) =>
                setEditingSlot({ roundIndex: activeRoundIndex, categoryIndex, slotIndex })
              }
            />
          </>
        )}

        {pack.rounds.length === 0 && <p className={styles.statusLine}>Додайте хоча б один раунд.</p>}
      </section>

      {editingSlot && editingQuestion && (
        <QuestionEditorPanel
          key={`${editingSlot.roundIndex}-${editingSlot.categoryIndex}-${editingSlot.slotIndex}`}
          packId={pack.id}
          question={editingQuestion}
          onApply={(question) => {
            const { roundIndex, categoryIndex, slotIndex } = editingSlot;
            updateRound(roundIndex, (r) => ({
              ...r,
              categories: r.categories.map((c, ci) =>
                ci === categoryIndex
                  ? { ...c, slots: c.slots.map((s, si) => (si === slotIndex ? question : s)) }
                  : c,
              ),
            }));
            setEditingSlot(null);
          }}
          onClear={() => {
            const { roundIndex, categoryIndex, slotIndex } = editingSlot;
            updateRound(roundIndex, (r) => ({
              ...r,
              categories: r.categories.map((c, ci) =>
                ci === categoryIndex ? { ...c, slots: c.slots.map((s, si) => (si === slotIndex ? null : s)) } : c,
              ),
            }));
            setEditingSlot(null);
          }}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {confirmExit && (
        <ConfirmDialog
          title="Незбережені зміни"
          message="У цьому паку є незбережені зміни. Вийти без збереження?"
          confirmLabel="Вийти без збереження"
          danger
          onConfirm={() => {
            setConfirmExit(false);
            onBack();
          }}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </div>
  );
}
