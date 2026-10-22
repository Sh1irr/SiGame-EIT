import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'svoya-gra:theme';

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore write failures (e.g. private browsing, storage disabled).
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeStoredTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
