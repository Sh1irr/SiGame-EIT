import { useState } from 'react';
import adminStyles from './admin.module.css';
import styles from './AdminApp.module.css';
import { PackListScreen } from './PackListScreen';
import { PackEditorScreen } from './PackEditorScreen';

type View = { screen: 'list' } | { screen: 'editor'; packId: string };

interface AdminAppProps {
  onExit: () => void;
}

export function AdminApp({ onExit }: AdminAppProps) {
  const [view, setView] = useState<View>({ screen: 'list' });

  return (
    <div className={adminStyles.adminRoot}>
      <header className={styles.header}>
        <h1 className={styles.title}>Адмін — Своя гра</h1>
        <button type="button" className={styles.homeButton} onClick={onExit}>
          На головну
        </button>
      </header>
      <div className={styles.body}>
        {view.screen === 'list' ? (
          <PackListScreen onOpenPack={(packId) => setView({ screen: 'editor', packId })} />
        ) : (
          <PackEditorScreen packId={view.packId} onBack={() => setView({ screen: 'list' })} />
        )}
      </div>
    </div>
  );
}
