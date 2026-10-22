import { useEffect, useRef, useState } from 'react';
import styles from './PackListScreen.module.css';
import { ConfirmDialog } from './components/ConfirmDialog';
import { createPack, deletePack, duplicatePack, exportPack, importPack, listPacks, type PackSummary } from './api';

interface PackListScreenProps {
  onOpenPack: (packId: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PackListScreen({ onOpenPack }: PackListScreenProps) {
  const [packs, setPacks] = useState<PackSummary[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [packPendingDelete, setPackPendingDelete] = useState<PackSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      setPacks(await listPacks());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити список паків');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError('');
    try {
      const pack = await createPack();
      onOpenPack(pack.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити пак');
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate(id: string) {
    setBusy(true);
    setError('');
    try {
      await duplicatePack(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати пак');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(pack: PackSummary) {
    setBusy(true);
    setError('');
    try {
      await deletePack(pack.id);
      setPackPendingDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити пак');
    } finally {
      setBusy(false);
    }
  }

  async function handleExport(pack: PackSummary) {
    setError('');
    try {
      await exportPack(pack.id, pack.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося експортувати пак');
    }
  }

  async function handleImportFile(file: File) {
    setBusy(true);
    setError('');
    try {
      await importPack(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося імпортувати пак');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => fileInputRef.current?.click()}>
          Імпорт .zip
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void handleImportFile(file);
          }}
        />
        <button type="button" className={styles.primaryButton} disabled={busy} onClick={handleCreate}>
          Новий пак
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {packs === null ? (
        <p>Завантаження…</p>
      ) : packs.length === 0 ? (
        <div className={styles.empty}>Паків ще немає. Створіть новий або імпортуйте .zip.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Назва</th>
              <th>Статус</th>
              <th>Раундів</th>
              <th>Змінено</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => (
              <tr key={pack.id}>
                <td className={styles.titleCell} onClick={() => onOpenPack(pack.id)}>
                  {pack.title}
                </td>
                <td>
                  <span className={`${styles.badge} ${pack.status === 'ready' ? styles.badgeReady : styles.badgeDraft}`}>
                    {pack.status === 'ready' ? 'Готовий' : 'Чернетка'}
                  </span>
                </td>
                <td>{pack.roundsCount}</td>
                <td>{formatDate(pack.updatedAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.actionButton} onClick={() => onOpenPack(pack.id)}>
                      Відкрити
                    </button>
                    <button type="button" className={styles.actionButton} disabled={busy} onClick={() => handleDuplicate(pack.id)}>
                      Дублювати
                    </button>
                    <button type="button" className={styles.actionButton} disabled={busy} onClick={() => handleExport(pack)}>
                      Експорт
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.danger}`}
                      disabled={busy}
                      onClick={() => setPackPendingDelete(pack)}
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {packPendingDelete && (
        <ConfirmDialog
          title="Видалити пак?"
          message={`Пак «${packPendingDelete.title}» та всі його медіафайли буде видалено безповоротно.`}
          confirmLabel="Видалити"
          danger
          onConfirm={() => handleDelete(packPendingDelete)}
          onCancel={() => setPackPendingDelete(null)}
        />
      )}
    </div>
  );
}
